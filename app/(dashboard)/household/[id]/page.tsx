import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  DollarSign,
  User,
  Settings,
  Sparkles,
  PieChart as PieChartIcon,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyLogBook } from "@/components/household/monthly-log-book";
import { CategoryChart } from "@/components/household/category-chart";

interface HouseholdPageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdPage({ params }: HouseholdPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get household
  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", id)
    .single();

  if (!household) {
    notFound();
  }

  // Get members
  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", id)
    .order("joined_at", { ascending: true });

  // Get current user's member record
  const currentMember = members?.find((m) => m.user_id === user.id);
  const isOwner = currentMember?.role === "owner";

  // Get all income logs for this household
  const { data: allIncomes } = await supabase
    .from("household_income_logs")
    .select("*")
    .eq("household_id", id);

  // Get all expense logs for this household
  const { data: allExpenses } = await supabase
    .from("household_expense_logs")
    .select("*")
    .eq("household_id", id);

  // Get recent income logs
  const { data: incomeLogs } = await supabase
    .from("household_income_logs")
    .select("*, household_members(name)")
    .eq("household_id", id)
    .order("date", { ascending: false })
    .limit(5);

  // Get recent expense logs
  const { data: expenseLogs } = await supabase
    .from("household_expense_logs")
    .select("*, household_members(name)")
    .eq("household_id", id)
    .order("date", { ascending: false })
    .limit(5);

  // Calculate balances for each member
  const memberBalances = (members || []).map((member) => {
    const memberIncomes = (allIncomes || []).filter(
      (i) => i.member_id === member.id,
    );
    const memberExpenses = (allExpenses || []).filter(
      (e) => e.member_id === member.id,
    );

    const totalIncome = memberIncomes.reduce(
      (sum, i) => sum + Number(i.amount),
      0,
    );
    const totalExpenses = memberExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    return {
      member_id: member.id,
      member_name: member.name,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_balance: totalIncome - totalExpenses,
    };
  });

  const totalIncome =
    memberBalances.reduce((sum, b) => sum + b.total_income, 0) || 0;
  const totalExpenses =
    memberBalances.reduce((sum, b) => sum + b.total_expenses, 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full glass">
            <Link href="/household">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-3xl font-black text-foreground tracking-tight">
                 {household.name}
               </h1>
               <Badge className="bg-primary/10 text-primary border-transparent">Monthly Log</Badge>
            </div>
            {household.description && (
              <p className="text-muted-foreground font-medium italic mt-1">{household.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
           {isOwner && (
             <Button variant="outline" size="icon" asChild className="rounded-full glass">
               <Link href={`/household/${id}/settings`}>
                 <Settings className="h-4 w-4" />
               </Link>
             </Button>
           )}
           <Button asChild className="rounded-full shadow-lg shadow-primary/20">
              <Link href={`/household/${id}/expense/new`}>
                 <Plus className="h-4 w-4 mr-2" />
                 Add Expense
              </Link>
           </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-success tracking-tighter">
              {formatCurrency(totalIncome, household.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-destructive tracking-tighter">
              {formatCurrency(totalExpenses, household.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
               "text-2xl font-black tracking-tighter",
               netBalance >= 0 ? "text-success" : "text-destructive"
            )}>
               {netBalance >= 0 ? "+" : ""}
               {formatCurrency(netBalance, household.currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-darker border-transparent shadow-xl relative overflow-hidden group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black tracking-tighter">
               {members?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-8">
            <Card className="glass border-transparent shadow-2xl">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <LayoutGrid className="h-5 w-5 text-primary" />
                     Monthly Log Book
                  </CardTitle>
                  <CardDescription>Consolidated ledger for all transactions</CardDescription>
               </CardHeader>
               <CardContent>
                  <MonthlyLogBook
                    householdId={id}
                    currency={household.currency}
                    members={(members || []).map((member) => ({
                      id: member.id,
                      name: member.name,
                    }))}
                    incomes={(allIncomes || []).map((income) => ({
                      id: income.id,
                      member_id: income.member_id,
                      amount: income.amount,
                      description: income.description,
                      source: income.source,
                      date: income.date,
                    }))}
                    expenses={(allExpenses || []).map((expense) => ({
                      id: expense.id,
                      member_id: expense.member_id,
                      amount: expense.amount,
                      description: expense.description,
                      category: expense.category,
                      date: expense.date,
                    }))}
                  />
               </CardContent>
            </Card>

            <Card className="glass border-transparent shadow-2xl">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <PieChartIcon className="h-5 w-5 text-primary" />
                     Spending by Category
                  </CardTitle>
                  <CardDescription>Where your money is going</CardDescription>
               </CardHeader>
               <CardContent>
                  <CategoryChart expenses={allExpenses || []} />
               </CardContent>
            </Card>
         </div>

         <div className="space-y-8">
            {/* Member Contributions */}
            <Card className="glass border-transparent shadow-2xl overflow-hidden">
               <CardHeader>
                  <CardTitle className="text-lg font-bold">Member Contribution</CardTitle>
               </CardHeader>
               <CardContent className="px-0">
                  <div className="space-y-1">
                     {memberBalances.map((balance) => (
                        <Link 
                           key={balance.member_id} 
                           href={`/household/${id}/member/${balance.member_id}`}
                           className="flex items-center justify-between px-6 py-4 hover:bg-primary/5 transition-colors group"
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                                 {balance.member_name[0].toUpperCase()}
                              </div>
                              <div>
                                 <p className="font-bold text-sm">{balance.member_name}</p>
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                                    {balance.net_balance >= 0 ? "Contributor" : "Spender"}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn(
                                 "font-black text-sm tracking-tight",
                                 balance.net_balance >= 0 ? "text-success" : "text-destructive"
                              )}>
                                 {balance.net_balance >= 0 ? "+" : ""}
                                 {formatCurrency(balance.net_balance, household.currency)}
                              </p>
                              <p className="text-[9px] text-muted-foreground">NET BALANCE</p>
                           </div>
                        </Link>
                     ))}
                  </div>
               </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="glass border-transparent shadow-2xl">
               <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Recent Updates</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                  {[...(incomeLogs || []).map(l => ({ ...l, type: 'income' })), ...(expenseLogs || []).map(l => ({ ...l, type: 'expense' }))]
                     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                     .slice(0, 5)
                     .map((log) => (
                        <div key={log.id} className="flex items-start gap-3 group">
                           <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                              log.type === 'income' ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"
                           )}>
                              {log.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                                 {log.description || log.source || 'No description'}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                                    {log.household_members.name}
                                 </p>
                                 <p className={cn(
                                    "text-[10px] font-black",
                                    log.type === 'income' ? "text-success" : "text-destructive"
                                 )}>
                                    {log.type === 'income' ? "+" : "-"}
                                    {formatCurrency(log.amount, household.currency)}
                                 </p>
                              </div>
                           </div>
                        </div>
                     ))}
                  {(!incomeLogs?.length && !expenseLogs?.length) && (
                     <p className="text-xs text-muted-foreground text-center italic">No updates yet</p>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
