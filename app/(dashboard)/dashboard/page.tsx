import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import Link from 'next/link'
import { Plus, Users, TrendingUp, TrendingDown, ArrowRight, Home, Wallet, Receipt, CreditCard, Sparkles, PieChart, History } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { BalanceSummary } from '@/components/dashboard/balance-summary'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PageHeader } from '@/components/dashboard/page-header'
import { SpendingChart } from '@/components/dashboard/spending-chart'

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

  // Get recent activity (unified)
  const { data: groupActivities } = await supabase
    .from('activities')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])
    .order('created_at', { ascending: false })
    .limit(10)

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
    .select('household_id, amount, date')
    .in('household_id', householdIds.length > 0 ? householdIds : [''])

  const { data: householdExpenses } = await supabase
    .from('household_expense_logs')
    .select('household_id, amount, date')
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

  // Combine data for chart
  const chartData = [
     ...(expenses ?? []).map(e => ({ date: e.date, amount: Number(e.amount), type: 'expense', source: 'group' })),
     ...(householdExpenses ?? []).map(e => ({ date: e.date, amount: Number(e.amount), type: 'expense', source: 'household' })),
     ...(householdIncomes ?? []).map(i => ({ date: i.date, amount: Number(i.amount), type: 'income', source: 'household' }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Overview"
          description="A bird's eye view of your shared finances"
        />
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" className="rounded-full glass hover:bg-secondary/80" asChild>
              <Link href="/activity">
                <History className="mr-2 h-4 w-4" />
                History
              </Link>
           </Button>
           <Button className="rounded-full shadow-lg shadow-primary/20" asChild>
              <Link href="/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Link>
           </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp className="h-12 w-12 text-success" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              You are owed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-success tracking-tighter">
              {formatCurrency(Math.max(0, totalOwed))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingDown className="h-12 w-12 text-destructive" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              You owe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive tracking-tighter">
              {formatCurrency(Math.max(0, totalOwing))}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group md:col-span-2 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Household Net
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-3xl font-black tracking-tighter ${householdNet >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(householdNet)}
            </div>
            <div className="text-xs font-medium text-muted-foreground mb-1">
               {households?.length ?? 0} Active Monthly Logs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <QuickActionCard 
            icon={Receipt} 
            label="Add Group Expense" 
            href={groups?.[0] ? `/groups/${groups[0].id}/expenses/new` : "/groups/new"} 
            color="bg-blue-500" 
         />
         <QuickActionCard 
            icon={TrendingUp} 
            label="Log Household Income" 
            href={latestHousehold ? `/household/${latestHousehold.id}/income/new` : "/household/new"} 
            color="bg-emerald-500" 
         />
         <QuickActionCard 
            icon={CreditCard} 
            label="Log Household Expense" 
            href={latestHousehold ? `/household/${latestHousehold.id}/expense/new` : "/household/new"} 
            color="bg-orange-500" 
         />
         <QuickActionCard 
            icon={Users} 
            label="Manage Members" 
            href="/groups" 
            color="bg-purple-500" 
         />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
           <Card className="glass shadow-2xl border-transparent">
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2">
                       <PieChart className="h-5 w-5 text-primary" />
                       Spending Trend
                    </CardTitle>
                    <CardDescription>Visual overview of your shared finances</CardDescription>
                 </div>
              </CardHeader>
              <CardContent className="pt-4">
                 <SpendingChart data={chartData} />
              </CardContent>
           </Card>

           <div className="grid gap-6 md:grid-cols-2">
              <Card className="glass border-transparent shadow-xl">
                 <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-bold">Recent Groups</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="rounded-full">
                       <Link href="/groups">View All</Link>
                    </Button>
                 </CardHeader>
                 <CardContent>
                    {!groups || groups.length === 0 ? (
                       <Empty
                          icon={<Users className="h-8 w-8" />}
                          title="No groups"
                          description="Start splitting with friends."
                          action={<Link href="/groups/new" className="text-primary text-sm font-bold">Create Group</Link>}
                       />
                    ) : (
                       <div className="space-y-3">
                          {groups.map((group) => (
                             <Link
                                key={group.id}
                                href={`/groups/${group.id}`}
                                className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group"
                             >
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <Users className="h-5 w-5 text-primary" />
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm">{group.name}</p>
                                      <p className="text-[10px] uppercase font-black text-muted-foreground">{group.currency}</p>
                                   </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                             </Link>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>

              <Card className="glass border-transparent shadow-xl">
                 <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg font-bold">Monthly Logs</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="rounded-full">
                       <Link href="/household">View All</Link>
                    </Button>
                 </CardHeader>
                 <CardContent>
                    {!households || households.length === 0 ? (
                       <Empty
                          icon={<Home className="h-8 w-8" />}
                          title="No households"
                          description="Track family finances."
                          action={<Link href="/household/new" className="text-primary text-sm font-bold">Create Log</Link>}
                       />
                    ) : (
                       <div className="space-y-3">
                          {households.slice(0, 3).map((household) => (
                             <Link
                                key={household.id}
                                href={`/household/${household.id}`}
                                className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group"
                             >
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <Wallet className="h-5 w-5 text-primary" />
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm">{household.name}</p>
                                      <p className="text-[10px] uppercase font-black text-muted-foreground">{household.currency}</p>
                                   </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                             </Link>
                          ))}
                       </div>
                    )}
                 </CardContent>
              </Card>
           </div>
        </div>

        {/* Sidebar Activity & Balance */}
        <div className="space-y-8">
           <BalanceSummary 
              userMemberIds={userMemberIds} 
              allMembers={allMembers ?? []} 
              expenses={expenses ?? []} 
              settlements={settlements ?? []}
           />
           <RecentActivity activities={groupActivities ?? []} groups={groups ?? []} />
        </div>
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, label, href, color }: { icon: any, label: string, href: string, color: string }) {
   return (
      <Link href={href}>
         <Card className="glass hover:bg-card/80 border-transparent shadow-lg transition-all hover:-translate-y-1 group">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
               <div className={`p-3 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
               </div>
               <span className="text-[11px] font-bold leading-tight text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            </CardContent>
         </Card>
      </Link>
   )
}
