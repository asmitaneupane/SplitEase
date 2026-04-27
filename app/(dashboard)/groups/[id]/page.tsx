import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import Link from 'next/link'
import { ArrowLeft, Plus, Receipt, Users, Settings, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { GroupMembers } from '@/components/groups/group-members'
import { GroupExpenses } from '@/components/groups/group-expenses'
import { GroupBalances } from '@/components/groups/group-balances'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get group
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) {
    notFound()
  }

  // Get members
  const { data: members } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', id)
    .order('joined_at', { ascending: true })

  // Get current user's member record
  const currentMember = members?.find((m) => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'

  // Get expenses with splits
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .eq('group_id', id)
    .order('date', { ascending: false })

  // Get settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .eq('group_id', id)
    .order('settled_at', { ascending: false })

  // Calculate totals
  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0
  const totalSettled = settlements?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0

  // Calculate user's balance in this group
  const userMemberIds = members?.filter((m) => m.user_id === user.id).map((m) => m.id) ?? []
  let userOwed = 0
  let userOwes = 0

  expenses?.forEach((expense) => {
    const isPayer = userMemberIds.includes(expense.paid_by)
    expense.expense_splits?.forEach((split: { member_id: string; amount: number; is_settled: boolean }) => {
      if (split.is_settled) return
      if (isPayer && !userMemberIds.includes(split.member_id)) {
        userOwed += Number(split.amount)
      } else if (!isPayer && userMemberIds.includes(split.member_id)) {
        userOwes += Number(split.amount)
      }
    })
  })

  settlements?.forEach((settlement) => {
    if (userMemberIds.includes(settlement.from_member)) {
      userOwes -= Number(settlement.amount)
    }
    if (userMemberIds.includes(settlement.to_member)) {
      userOwed -= Number(settlement.amount)
    }
  })

  const userBalance = userOwed - userOwes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/groups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground">
              {group.description || `${members?.length ?? 0} members • ${group.currency}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          <Button asChild>
            <Link href={`/groups/${id}/expenses/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/groups/${id}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses, group.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses?.length ?? 0} expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Settled
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(totalSettled, group.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {settlements?.length ?? 0} settlements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Balance
            </CardTitle>
            {userBalance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${userBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {userBalance >= 0 ? '+' : ''}{formatCurrency(userBalance, group.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {userBalance >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <GroupExpenses 
            groupId={id} 
            expenses={expenses ?? []} 
            members={members ?? []} 
            currency={group.currency}
          />
        </TabsContent>

        <TabsContent value="balances">
          <GroupBalances 
            groupId={id}
            members={members ?? []} 
            expenses={expenses ?? []} 
            settlements={settlements ?? []}
            currency={group.currency}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="members">
          <GroupMembers 
            groupId={id} 
            members={members ?? []} 
            isAdmin={isAdmin}
            currentUserId={user.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
