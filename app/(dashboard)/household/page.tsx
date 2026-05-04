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
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Monthly Logs"
        description="Private financial spaces for your partner and family"
        actions={
          <Button asChild className="rounded-full shadow-lg shadow-primary/20">
          <Link href="/household/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Monthly Log
          </Link>
          </Button>
        }
      />

      {/* Households List */}
      {households && households.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {households.map((entry) => {
            const household = Array.isArray(entry.households)
              ? entry.households[0]
              : entry.households;
            if (!household) return null;
            const members = householdBalances.filter(
              (b) => b.household_id === entry.household_id,
            );
            const totalIncome = members.reduce(
              (sum, m) => sum + m.total_income,
              0,
            );
            const totalExpenses = members.reduce(
              (sum, m) => sum + m.total_expenses,
              0,
            );

            return (
              <Card key={household.id} className="glass hover:bg-card transition-all duration-300 border-transparent shadow-xl group hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                           <Home className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl font-bold tracking-tight">{household.name}</CardTitle>
                      </div>
                      {household.description && (
                        <CardDescription className="mt-2 line-clamp-1 font-medium italic">
                          "{household.description}"
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <HouseholdActions
                        householdId={household.id}
                        householdName={household.name}
                        householdDescription={household.description}
                        householdCurrency={household.currency}
                        isOwner={household.created_by === user?.id}
                      />
                    </div>
                  </div>
                </CardHeader>
                <Link href={`/household/${household.id}`} className="block">
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-success/5 border border-success/10 group-hover:bg-success/10 transition-colors">
                        <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1">Income</p>
                        <p className="text-xl font-black text-success tracking-tighter">
                          {formatCurrency(totalIncome, household.currency)}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/10 group-hover:bg-destructive/10 transition-colors">
                        <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Expenses</p>
                        <p className="text-xl font-black text-destructive tracking-tighter">
                          {formatCurrency(totalExpenses, household.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Members</p>
                          <div className="h-px flex-1 bg-border/30 mx-3" />
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {members.map((member) => (
                            <Badge
                              key={member.member_id}
                              variant="secondary"
                              className="rounded-full px-3 py-1 text-[10px] font-bold border-transparent bg-secondary/80"
                            >
                              {member.member_name}
                              <span className={cn(
                                "ml-2 font-black",
                                member.net_balance >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {member.net_balance >= 0 ? "+" : ""}
                                {formatCurrency(member.net_balance, household.currency)}
                              </span>
                            </Badge>
                          ))}
                       </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass border-transparent shadow-2xl p-12 text-center">
          <CardContent>
            <Empty
              icon={<Home className="h-16 w-16 text-primary/20" />}
              title="A fresh start"
              description="Create your first monthly log to manage shared household finances with transparency."
              action={
                <Button asChild size="lg" className="rounded-full px-8 font-bold shadow-xl shadow-primary/20">
                  <Link href="/household/new">
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Monthly Log
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
