import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  Home,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRight,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { HouseholdActions } from "@/components/household/household-actions";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/dashboard/page-header";

export default async function HouseholdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: households } = await supabase
    .from("household_members")
    .select("household_id, households(*)")
    .eq("user_id", user.id);

  const { data: allMembers } = await supabase
    .from("household_members")
    .select("*");

  const { data: incomes } = await supabase
    .from("household_income_logs")
    .select("*");

  const { data: expenses } = await supabase
    .from("household_expense_logs")
    .select("*");

  const householdBalances = (allMembers || []).map((member) => {
    const memberIncomes = (incomes || []).filter(
      (i) => i.member_id === member.id,
    );
    const memberExpenses = (expenses || []).filter(
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
      household_id: member.household_id,
      member_id: member.id,
      member_name: member.name,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_balance: totalIncome - totalExpenses,
    };
  });

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/5 pb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            Private Circles
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            Households
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-md">
            Exclusive financial tracking for your private households and individual budgets.
          </p>
        </div>
        <Button size="elegant" asChild className="shadow-lg shadow-primary/10">
          <Link href="/household/new">
            <Plus className="mr-2 h-4 w-4" />
            New Household Space
          </Link>
        </Button>
      </div>

      {households && households.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
          {households.map((entry) => {
            const household = Array.isArray(entry.households)
              ? entry.households[0]
              : entry.households;
            if (!household) return null;
            
            const members = householdBalances.filter(
              (b) => b.household_id === entry.household_id,
            );
            const totalIncome = members.reduce((sum, m) => sum + m.total_income, 0);
            const totalExpenses = members.reduce((sum, m) => sum + m.total_expenses, 0);

            return (
              <Card key={household.id} className="bg-white border-black/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 rounded-[1.5rem] overflow-hidden group">
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm shrink-0">
                        <Home className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors truncate">
                          {household.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400 line-clamp-1 leading-relaxed">
                          {household.description || "Private financial circle"}
                        </CardDescription>
                      </div>
                    </div>
                    <HouseholdActions
                      householdId={household.id}
                      householdName={household.name}
                      householdDescription={household.description}
                      householdCurrency={household.currency}
                      isOwner={household.created_by === user?.id}
                    />
                  </div>
                </CardHeader>

                <Link href={`/household/${household.slug || household.id}`} className="block">
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-black/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Inflow</p>
                        <p className="text-xl font-black text-emerald-500 tracking-tighter">
                          {formatCurrency(totalIncome, household.currency)}
                        </p>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-black/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Outflow</p>
                        <p className="text-xl font-black text-rose-500 tracking-tighter">
                          {formatCurrency(totalExpenses, household.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/5">
                       <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {members.slice(0, 3).map((member) => (
                              <div key={member.member_id} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-primary uppercase shadow-sm">
                                 {member.member_name[0]}
                              </div>
                            ))}
                          </div>
                          {members.length > 3 && (
                            <span className="text-[10px] font-black text-slate-300 ml-1">+{members.length - 3} others</span>
                          )}
                       </div>
                       <div className="w-10 h-10 rounded-full bg-slate-50 border border-black/5 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-24 bg-white rounded-[2.5rem] border border-black/5 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-black/5 shadow-inner">
            <Home className="h-10 w-10 text-slate-300" />
          </div>
          <div className="max-w-xs mx-auto space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">No Households Yet</h3>
            <p className="text-slate-400 text-sm font-medium">
              Create your first household space to start tracking private expenses.
            </p>
          </div>
          <Button asChild size="elegant" className="px-10">
            <Link href="/household/new">Create Household Space</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
