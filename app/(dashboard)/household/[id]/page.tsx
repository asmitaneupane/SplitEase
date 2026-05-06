import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  DollarSign,
  UserPlus,
  Settings,
  PieChart as PieChartIcon,
  LayoutGrid,
  Zap,
  ChevronRight,
  History,
  Sparkles,
  Users,
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
import { MonthlyLogBook } from "@/components/household/monthly-log-book";
import { CategoryChart } from "@/components/household/category-chart";
import { HouseholdMembers } from "@/components/household/household-members";

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

  // Get household - Robust lookup (supports ID or Slug)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let household;

  if (isUUID) {
    const { data } = await supabase.from("households").select("*").eq("id", id).single();
    household = data;
  }

  if (!household) {
    const { data } = await supabase.from("households").select("*").eq("slug", id).single();
    household = data;
  }

  if (!household) {
    notFound();
  }

  // Get members
  const { data: members } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", household.id)
    .order("joined_at", { ascending: true });

  const currentMember = members?.find((m) => m.user_id === user.id);
  const isOwner = currentMember?.role === "owner" || household.created_by === user.id;

  const { data: allIncomes } = await supabase
    .from("household_income_logs")
    .select("*")
    .eq("household_id", household.id);

  const { data: allExpenses } = await supabase
    .from("household_expense_logs")
    .select("*")
    .eq("household_id", household.id);

  const { data: incomeLogs } = await supabase
    .from("household_income_logs")
    .select("*, household_members(name)")
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .limit(5);

  const { data: expenseLogs } = await supabase
    .from("household_expense_logs")
    .select("*, household_members(name)")
    .eq("household_id", household.id)
    .order("date", { ascending: false })
    .limit(5);

  const memberBalances = (members || []).map((member) => {
    const mIncomes = (allIncomes || []).filter((i) => i.member_id === member.id);
    const mExpenses = (allExpenses || []).filter((e) => e.member_id === member.id);
    const tIncome = mIncomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const tExpense = mExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      id: member.id,
      name: member.name,
      income: tIncome,
      expense: tExpense,
      balance: tIncome - tExpense,
    };
  });

  const totalIncome = memberBalances.reduce((sum, b) => sum + b.income, 0) || 0;
  const totalExpenses = memberBalances.reduce((sum, b) => sum + b.expense, 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-10 pb-20 animate-in-slide">
      {/* Minimal Header */}
      <div className="relative p-10 rounded-[2rem] bg-white border border-black/5 shadow-sm overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-12 h-12">
              <Link href="/household">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight">{household.name}</h1>
                <Badge variant="outline" className="rounded-full border-black/10 text-muted-foreground/40 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                  {household.currency}
                </Badge>
              </div>
              {household.description && (
                <p className="text-muted-foreground/60 text-sm font-medium">
                  {household.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <Button size="elegant" asChild>
                <Link href={`/household/${household.slug || household.id}/income/new`}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Income
                </Link>
             </Button>
             <Button variant="outline" size="elegant" asChild className="border-rose-600/20 text-rose-600 hover:bg-rose-600 hover:text-white">
                <Link href={`/household/${household.slug || household.id}/expense/new`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Expense
                </Link>
             </Button>
             {isOwner && (
                <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-11 h-11">
                  <Link href={`/household/${household.slug || household.id}/settings`}>
                    <Settings className="h-5 w-5 text-muted-foreground/50" />
                  </Link>
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Inflow" amount={totalIncome} currency={household.currency} color="text-emerald-400" />
        <StatCard title="Total Outflow" amount={totalExpenses} currency={household.currency} color="text-rose-400" />
        <StatCard title="Net Position" amount={netBalance} currency={household.currency} color={netBalance >= 0 ? "text-primary" : "text-rose-400"} isNet />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-transparent border-none shadow-none overflow-visible">
            <CardHeader className="px-0 pb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  Transaction Ledger
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <MonthlyLogBook
                householdId={household.id}
                currency={household.currency}
                members={(members || []).map((m) => ({ id: m.id, name: m.name }))}
                incomes={(allIncomes || []).map((i) => ({ ...i, amount: Number(i.amount) }))}
                expenses={(allExpenses || []).map((e) => ({ ...e, amount: Number(e.amount) }))}
              />
            </CardContent>
          </Card>

          <Card className="glass border-white/5 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CategoryChart expenses={allExpenses || []} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <HouseholdMembers 
            householdId={household.id}
            householdName={household.name}
            householdSlug={household.slug}
            members={members || []}
            isOwner={isOwner}
            currentUserId={user.id}
          />

          <Card className="glass border-white/5 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-white/5 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Recent Updates</CardTitle>
              <History className="h-4 w-4 text-muted-foreground/30" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[...(incomeLogs || []).map(l => ({ ...l, type: 'income' })), ...(expenseLogs || []).map(l => ({ ...l, type: 'expense' }))]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((log) => (
                  <div key={log.id} className="flex items-start gap-3 group animate-in-fade">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                      log.type === 'income' ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-rose-500/5 text-rose-400 border-rose-500/10"
                    )}>
                      {log.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold tracking-tight truncate group-hover:text-primary transition-colors">
                        {log.description || log.source || 'No description'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          {log.household_members.name}
                        </p>
                        <p className={cn(
                          "text-xs font-black tracking-tight",
                          log.type === 'income' ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {log.type === 'income' ? "+" : "-"}
                          {formatCurrency(log.amount, household.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, currency, color, isNet }: any) {
  return (
    <Card className="glass border-white/5 shadow-sm relative overflow-hidden group">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-black tracking-tighter ${color}`}>
          {isNet && amount >= 0 ? "+" : ""}
          {formatCurrency(amount, currency)}
        </div>
      </CardContent>
    </Card>
  )
}
