import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import Link from 'next/link'
import { Plus, Users, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { BalanceSummary } from '@/components/dashboard/balance-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your expenses and balances</p>
        </div>
        <Button asChild>
          <Link href="/groups/new">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Link>
        </Button>
      </div>

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

      {/* Recent Activity */}
      <RecentActivity activities={activities ?? []} groups={groups ?? []} />
    </div>
  )
}
