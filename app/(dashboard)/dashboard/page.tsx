import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
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
    .limit(20)

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
     ...(expenses ?? []).map(e => ({ date: e.date, amount: Number(e.amount), type: 'expense' as const, source: 'group' as const })),
     ...(householdExpenses ?? []).map(e => ({ date: e.date, amount: Number(e.amount), type: 'expense' as const, source: 'household' as const })),
     ...(householdIncomes ?? []).map(i => ({ date: i.date, amount: Number(i.amount), type: 'income' as const, source: 'household' as const }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const groupsWithAmount = groups?.map((group) => {
    const groupExpenses = expenses?.filter(e => e.group_id === group.id) || [];
    const totalSpent = groupExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      ...group,
      amount: totalSpent
    }
  }) || [];

  const householdsWithAmount = households?.map((household) => {
    const incomes = householdIncomes?.filter(i => i.household_id === household.id) || [];
    const exps = householdExpenses?.filter(e => e.household_id === household.id) || [];
    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalExpense = exps.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      ...household,
      amount: totalIncome - totalExpense
    }
  }) || [];

  return (
    <div className="space-y-10 pb-20">
      <div className="relative p-10 rounded-[2rem] bg-white border border-black/5 shadow-sm overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3" />
              Command Center
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground/60 text-sm max-w-md font-medium">
              A comprehensive overview of your financial circles and household tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
             <Button variant="ghost" size="elegant" asChild>
                <Link href="/activity">
                  <History className="mr-2 h-4 w-4" />
                  Activity
                </Link>
             </Button>
             <Button size="elegant" asChild>
                <Link href="/groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Group
                </Link>
             </Button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard 
          title="Owed to You" 
          amount={totalOwed} 
          icon={TrendingUp} 
          trend="Positive" 
          color="text-emerald-400"
          bg="bg-emerald-500/5"
        />
        <StatCard 
          title="Total Debt" 
          amount={totalOwing} 
          icon={TrendingDown} 
          trend="Negative" 
          color="text-rose-400"
          bg="bg-rose-500/5"
        />
        <Card className="bg-white border-black/5 shadow-sm relative overflow-hidden group md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
              Household Net Position
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className={`text-4xl md:text-5xl font-black tracking-tighter ${householdNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(householdNet)}
            </div>
            <div className="px-3 py-1 rounded-full bg-black/[0.02] text-[9px] font-black uppercase tracking-wider text-muted-foreground/40 border border-black/5">
              {households?.length ?? 0} Logs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <QuickActionCard 
            icon={Receipt} 
            label="Group Expense" 
            href={groups?.[0] ? `/groups/${groups[0].slug || groups[0].id}/expenses/new` : "/groups/new"} 
         />
         <QuickActionCard 
            icon={TrendingUp} 
            label="Log Income" 
            href={latestHousehold ? `/household/${latestHousehold.slug || latestHousehold.id}/income/new` : "/household/new"} 
         />
         <QuickActionCard 
            icon={CreditCard} 
            label="Log Expense" 
            href={latestHousehold ? `/household/${latestHousehold.slug || latestHousehold.id}/expense/new` : "/household/new"} 
         />
         <QuickActionCard 
            icon={Users} 
            label="Members" 
            href="/groups" 
         />
      </div>

      <div className="grid gap-10 lg:grid-cols-3 items-start">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-10">
           <Card className="bg-white shadow-sm border-black/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 bg-black/[0.01] p-6">
                 <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-black">
                       <PieChart className="h-6 w-6 text-primary" />
                       Spending Insights
                    </CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-40">7-Day Transaction Trend</CardDescription>
                 </div>
                 <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                   Real-time
                 </Badge>
              </CardHeader>
              <CardContent className="p-8">
                 <SpendingChart data={chartData} />
              </CardContent>
           </Card>

           <div className="grid gap-6 md:grid-cols-2">
              <ListCard 
                title="Recent Groups" 
                items={groupsWithAmount} 
                icon={Users} 
                hrefPrefix="/groups"
                emptyTitle="No active groups"
                emptyDescription="Start splitting expenses with your circles."
                emptyActionHref="/groups/new"
                emptyActionText="Create Group"
              />
              <ListCard 
                title="Households" 
                subtitle="Your private financial spaces"
                items={householdsWithAmount.slice(0, 5)} 
                icon={Wallet} 
                hrefPrefix="/household" 
                emptyTitle="No logs found"
                emptyDescription="Keep track of your household budget."
                emptyActionHref="/household/new"
                emptyActionText="New Log"
              />
           </div>
        </div>

        {/* Sidebar Activity & Balance */}
        <div className="self-stretch flex flex-col gap-10 h-0 min-h-full">
           <BalanceSummary 
              userMemberIds={userMemberIds} 
              allMembers={allMembers ?? []} 
              expenses={expenses ?? []} 
              settlements={settlements ?? []}
           />
           <div className="flex-1 min-h-0">
             <RecentActivity activities={groupActivities ?? []} groups={groups ?? []} />
           </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, amount, color }: any) {
  return (
    <Card className="bg-white border-black/5 shadow-sm relative overflow-hidden group">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-black tracking-tighter ${color}`}>
          {formatCurrency(Math.max(0, amount))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionCard({ icon: Icon, label, href }: { icon: any, label: string, href: string }) {
   return (
      <Link href={href}>
         <Card className="bg-white hover:bg-black/[0.01] border-black/5 shadow-sm transition-all duration-300 group">
            <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
               <div className="w-12 h-12 rounded-2xl bg-black/[0.02] border border-black/5 flex items-center justify-center text-primary group-hover:scale-105 transition-all">
                  <Icon className="h-5 w-5" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-primary transition-colors">{label}</span>
            </CardContent>
         </Card>
      </Link>
   )
}

function ListCard({ title, items, icon: Icon, hrefPrefix, emptyTitle, emptyDescription, emptyActionHref, emptyActionText }: any) {
  return (
    <Card className="bg-white border-black/[0.03] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02),0_4px_25px_-4px_rgba(0,0,0,0.03)] rounded-[2rem] overflow-hidden">
       <CardHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-black/[0.02] bg-slate-50/30">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{title}</CardTitle>
          <Button variant="ghost" size="sm" asChild className="rounded-full text-[9px] font-black uppercase tracking-wider h-7 px-3 group/link hover:bg-primary/5 hover:text-primary">
             <Link href={hrefPrefix} className="flex items-center gap-1">
               View All
               <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover/link:translate-x-0.5" />
             </Link>
          </Button>
       </CardHeader>
       <CardContent className="p-2">
          {items.length === 0 ? (
             <div className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                   <Icon className="h-6 w-6 text-slate-200" />
                </div>
                <p className="text-xs font-bold text-slate-800">{emptyTitle}</p>
                <p className="text-[10px] text-slate-400 mt-1 mb-4">{emptyDescription}</p>
                <Link href={emptyActionHref} className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">{emptyActionText}</Link>
             </div>
          ) : (
             <div className="space-y-1">
                {items.map((item: any) => (
                   <Link
                      key={item.id}
                      href={`${hrefPrefix}/${item.slug || item.id}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-all group active:scale-[0.98]"
                   >
                      <div className="flex items-center gap-3">
                         <div className="w-9 h-9 rounded-xl bg-indigo-50/50 border border-indigo-100/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                            <Icon className="h-4 w-4" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="font-bold text-sm tracking-tight text-slate-800 group-hover:text-primary transition-colors">{item.name}</p>
                            <p className="text-[10px] font-black text-emerald-500 tracking-tight flex items-center gap-1">
                               <span className="opacity-40 text-slate-400 font-medium">Amount:</span>
                               {formatCurrency(item.amount, item.currency)}
                            </p>
                         </div>
                      </div>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 bg-primary/10 text-primary transition-all -translate-x-2 group-hover:translate-x-0">
                         <ArrowRight className="h-3 w-3" />
                      </div>
                   </Link>
                ))}
             </div>
          )}
       </CardContent>
    </Card>
  )
}
