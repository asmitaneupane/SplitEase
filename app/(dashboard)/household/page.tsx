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
    <div className="space-y-6">
      <PageHeader
        title="Monthly Log"
        description="Manage shared monthly income and expense logs with your family"
        actions={
          <Button asChild>
          <Link href="/household/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Monthly Log
          </Link>
          </Button>
        }
      />

      {/* Households List */}
      {households && households.length > 0 ? (
        <div className="space-y-6">
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
              <div key={household.id} className="relative">
                <Card className="hover:bg-secondary/50 transition-colors overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Home className="h-5 w-5 text-primary" />
                          <CardTitle>{household.name}</CardTitle>
                        </div>
                        {household.description && (
                          <CardDescription className="mt-1">
                            {household.description}
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
                  <Separator />
                  <Link href={`/household/${household.id}`} className="block">
                    <CardContent className="pt-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="grid grid-cols-3 gap-4 flex-1">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Total Income
                            </p>
                            <p className="text-lg font-semibold text-success">
                              {formatCurrency(totalIncome, household.currency)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Total Expenses
                            </p>
                            <p className="text-lg font-semibold text-destructive">
                              {formatCurrency(
                                totalExpenses,
                                household.currency,
                              )}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Members
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              {members.length}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground mt-1" />
                      </div>

                      {/* Members Summary */}
                      {members.length > 0 && (
                        <div className="mt-4 pt-4 border-t space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Members
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {members.map((member) => (
                              <Badge
                                key={member.member_id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {member.member_name}
                                <span className="ml-1 font-semibold">
                                  {member.net_balance >= 0 ? "+" : ""}
                                  {formatCurrency(
                                    member.net_balance,
                                    household.currency,
                                  )}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Empty
              icon={<Home className="h-10 w-10" />}
              title="No households yet"
              description="Create a monthly log to start tracking shared finances with your partner or family."
              action={
                <Button asChild>
                  <Link href="/household/new">
                    <Plus className="h-4 w-4 mr-2" />
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
