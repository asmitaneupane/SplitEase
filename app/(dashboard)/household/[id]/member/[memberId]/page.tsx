import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, TrendingUp, DollarSign } from "lucide-react";
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

interface MemberPageProps {
  params: Promise<{ id: string; memberId: string }>;
}

export default async function MemberPage({ params }: MemberPageProps) {
  const { id, memberId } = await params;
  const supabase = await createClient();

  // Get household
  const { data: household } = await supabase
    .from("households")
    .select("*")
    .eq("id", id)
    .single();

  if (!household) {
    notFound();
  }

  // Get member
  const { data: member } = await supabase
    .from("household_members")
    .select("*")
    .eq("id", memberId)
    .single();

  if (!member) {
    notFound();
  }

  // Get member's income logs
  const { data: incomeLogs } = await supabase
    .from("household_income_logs")
    .select("*")
    .eq("member_id", memberId)
    .eq("household_id", id)
    .order("date", { ascending: false });

  // Get member's expense logs
  const { data: expenseLogs } = await supabase
    .from("household_expense_logs")
    .select("*")
    .eq("member_id", memberId)
    .eq("household_id", id)
    .order("date", { ascending: false });

  const totalIncome =
    incomeLogs?.reduce((sum, log) => sum + Number(log.amount), 0) || 0;
  const totalExpenses =
    expenseLogs?.reduce((sum, log) => sum + Number(log.amount), 0) || 0;
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/household/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{member.name}</h1>
          <p className="text-muted-foreground">{household.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      </div>

      {/* Income Logs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Income</h2>
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
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-success">
                        +{formatCurrency(log.amount, household.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No income logged
            </CardContent>
          </Card>
        )}
      </div>

      {/* Expense Logs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Expenses</h2>
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
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.date).toLocaleDateString()}
                      </p>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-destructive">
                        -{formatCurrency(log.amount, household.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No expenses logged
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
