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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyLogBook } from "@/components/household/monthly-log-book";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/household">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {household.name}
            </h1>
            {household.description && (
              <p className="text-muted-foreground">{household.description}</p>
            )}
          </div>
        </div>
        {isOwner && (
          <Button variant="outline" size="icon" asChild>
            <Link href={`/household/${id}/settings`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalIncome, household.currency)}
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalExpenses, household.currency)}
              </div>
              <DollarSign className="h-4 w-4 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`flex items-end justify-between`}>
              <div
                className={`text-2xl font-bold ${netBalance >= 0 ? "text-success" : "text-destructive"}`}
              >
                {netBalance >= 0 ? "+" : ""}
                {formatCurrency(netBalance, household.currency)}
              </div>
              <TrendingUp
                className={`h-4 w-4 ${netBalance >= 0 ? "text-success" : "text-destructive"}`}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{members?.length || 0}</div>
              <User className="h-4 w-4 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="balances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="balances">Monthly Log</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-4">
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

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Member Net Balances</h2>
          </div>

          {memberBalances && memberBalances.length > 0 ? (
            <div className="space-y-2">
              {memberBalances.map((balance) => (
                <Link
                  key={balance.member_id}
                  href={`/household/${id}/member/${balance.member_id}`}
                  className="block"
                >
                  <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {balance.member_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {balance.member_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Income:{" "}
                              {formatCurrency(
                                balance.total_income,
                                household.currency,
                              )}{" "}
                              • Expenses:{" "}
                              {formatCurrency(
                                balance.total_expenses,
                                household.currency,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${balance.net_balance >= 0 ? "text-success" : "text-destructive"}`}
                          >
                            {balance.net_balance >= 0 ? "+" : ""}
                            {formatCurrency(
                              balance.net_balance,
                              household.currency,
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {balance.net_balance >= 0
                              ? "Contributor"
                              : "Spender"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Income Logs</h2>
            <Button asChild size="sm">
              <Link href={`/household/${id}/income/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Link>
            </Button>
          </div>

          {incomeLogs && incomeLogs.length > 0 ? (
            <div className="space-y-2">
              {incomeLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {log.description || `Income from ${log.source}`}
                          </p>
                          {log.source && (
                            <Badge variant="secondary" className="text-xs">
                              {log.source}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.household_members.name} •{" "}
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">
                          +{formatCurrency(log.amount, household.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/household/${id}/income`}>View All Income</Link>
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No income logged yet
                </p>
                <Button asChild>
                  <Link href={`/household/${id}/income/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Income
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Expense Logs</h2>
            <Button asChild size="sm">
              <Link href={`/household/${id}/expense/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Link>
            </Button>
          </div>

          {expenseLogs && expenseLogs.length > 0 ? (
            <div className="space-y-2">
              {expenseLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {log.description}
                          </p>
                          {log.category && (
                            <Badge variant="secondary" className="text-xs">
                              {log.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.household_members.name} •{" "}
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">
                          -{formatCurrency(log.amount, household.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href={`/household/${id}/expense`}>View All Expenses</Link>
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  No expenses logged yet
                </p>
                <Button asChild>
                  <Link href={`/household/${id}/expense/new`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Household Members</h2>
            {isOwner && (
              <Button asChild size="sm">
                <Link href={`/household/${id}/settings`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Members
                </Link>
              </Button>
            )}
          </div>

          {members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div key={member.id}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {member.name[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {member.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            member.role === "owner" ? "default" : "secondary"
                          }
                        >
                          {member.role.charAt(0).toUpperCase() +
                            member.role.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
