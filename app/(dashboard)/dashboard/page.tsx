import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import Link from 'next/link'
import { Plus, Users, TrendingUp, TrendingDown, ArrowRight, Home, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { BalanceSummary } from '@/components/dashboard/balance-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PageHeader } from '@/components/dashboard/page-header'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's groups
  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberGroups?.map((m) => m.group_id) ?? []

  // Get groups data
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds.length > 0 ? groupIds : [''])
    .order('updated_at', { ascending: false })
    .limit(5)

  // Get all members from user's groups to calculate balances
  const { data: allMembers } = await supabase
    .from('group_members')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  // Get expenses from user's groups
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  // Get settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  // Calculate user's balances across all groups
  const userMemberIds = allMembers?.filter((m) => m.user_id === user.id).map((m) => m.id) ?? []
  
  let totalOwed = 0 // Money others owe to user
  let totalOwing = 0 // Money user owes to others

  // Calculate from expenses
  expenses?.forEach((expense) => {
    const isPayer = userMemberIds.includes(expense.paid_by)
    expense.expense_splits?.forEach((split: { member_id: string; amount: number; is_settled: boolean }) => {
      if (split.is_settled) return
      
      if (isPayer && !userMemberIds.includes(split.member_id)) {
        // User paid, someone else owes
        totalOwed += Number(split.amount)
      } else if (!isPayer && userMemberIds.includes(split.member_id)) {
        // Someone else paid, user owes
        totalOwing += Number(split.amount)
      }
    })
  })

  // Adjust for settlements
  settlements?.forEach((settlement) => {
    if (userMemberIds.includes(settlement.from_member)) {
      totalOwing -= Number(settlement.amount)
    }
    if (userMemberIds.includes(settlement.to_member)) {
      totalOwed -= Number(settlement.amount)
    }
  })

  const netBalance = totalOwed - totalOwing

  // Get recent activity
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])
    .order('created_at', { ascending: false })
    .limit(5)

  // Household snapshot
  const { data: householdMemberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)

  const householdIds = householdMemberships?.map((m) => m.household_id) ?? []

  const { data: households } = await supabase
    .from('households')
    .select('*')
    .in('id', householdIds.length > 0 ? householdIds : [''])
    .order('updated_at', { ascending: false })

  const { data: householdIncomes } = await supabase
    .from('household_income_logs')
    .select('household_id, amount')
    .in('household_id', householdIds.length > 0 ? householdIds : [''])

  const { data: householdExpenses } = await supabase
    .from('household_expense_logs')
    .select('household_id, amount')
    .in('household_id', householdIds.length > 0 ? householdIds : [''])

  const totalHouseholdIncome = (householdIncomes ?? []).reduce(
    (sum, income) => sum + Number(income.amount),
    0,
  )
  const totalHouseholdExpense = (householdExpenses ?? []).reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  )
  const householdNet = totalHouseholdIncome - totalHouseholdExpense
  const latestHousehold = households?.[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your expenses and balances"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/household">
                <Home className="mr-2 h-4 w-4" />
                View Monthly Logs
              </Link>
            </Button>
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Link>
            </Button>
          </>
        }
      />

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              You are owed
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(Math.max(0, totalOwed))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              You owe
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(Math.max(0, totalOwing))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            {netBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(netBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Groups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Groups</CardTitle>
              <CardDescription>Recent groups you&apos;re part of</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/groups">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!groups || groups.length === 0 ? (
              <Empty
                icon={<Users className="h-10 w-10" />}
                title="No groups yet"
                description="Create a group to start tracking expenses"
                action={
                  <Button asChild size="sm">
                    <Link href="/groups/new">
                      <Plus className="h-4 w-4 mr-1" />
                      Create Group
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">{group.currency}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <BalanceSummary 
          userMemberIds={userMemberIds} 
          allMembers={allMembers ?? []} 
          expenses={expenses ?? []} 
          settlements={settlements ?? []}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Monthly Log Snapshot
            </CardTitle>
            <CardDescription>
              Essential monthly log totals and quick access
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/household">
              Open Monthly Logs
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!households || households.length === 0 ? (
            <Empty
              icon={<Home className="h-10 w-10" />}
              title="No household yet"
              description="Create your first monthly log to track shared family income and expenses."
              action={
                <Button asChild size="sm">
                  <Link href="/household/new">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Monthly Log
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Households</p>
                  <p className="mt-1 text-2xl font-bold">{households.length}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="mt-1 text-lg font-bold text-success">
                    {formatCurrency(totalHouseholdIncome)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Expenses</p>
                  <p className="mt-1 text-lg font-bold text-destructive">
                    {formatCurrency(totalHouseholdExpense)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Net</p>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      householdNet >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(householdNet)}
                  </p>
                </div>
              </div>

              {latestHousehold ? (
                <Link
                  href={`/household/${latestHousehold.id}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Latest: {latestHousehold.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Currency: {latestHousehold.currency}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivity activities={activities ?? []} groups={groups ?? []} />
    </div>
  )
}
