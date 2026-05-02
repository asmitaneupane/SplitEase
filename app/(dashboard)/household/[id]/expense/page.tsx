import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface ExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdExpensePage({
  params,
}: ExpensePageProps) {
  const { id } = await params;
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

  // Get expense logs
  const { data: expenseLogs } = await supabase
    .from("household_expense_logs")
    .select("*, household_members(name)")
    .eq("household_id", id)
    .order("date", { ascending: false });

  const totalExpenses =
    expenseLogs?.reduce((sum, log) => sum + Number(log.amount), 0) || 0;

  // Group by category
  const expensesByCategory: Record<string, typeof expenseLogs> = {};
  expenseLogs?.forEach((log) => {
    if (!expensesByCategory[log.category]) {
      expensesByCategory[log.category] = [];
    }
    expensesByCategory[log.category].push(log);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/household/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Expense Logs</h1>
            <p className="text-muted-foreground">{household.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/household/${id}/expense/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">
            {formatCurrency(totalExpenses, household.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            From {expenseLogs?.length || 0} expense entries
          </p>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      {expenseLogs && expenseLogs.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(expensesByCategory).map(([category, logs]) => {
            const categoryTotal = logs.reduce(
              (sum, log) => sum + Number(log.amount),
              0,
            );
            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {category}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {logs.length} entries
                    </p>
                  </div>
                  <p className="text-lg font-bold text-destructive">
                    {formatCurrency(categoryTotal, household.currency)}
                  </p>
                </div>

                <div className="space-y-1">
                  {logs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {log.description}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.household_members.name} •{" "}
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
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No expenses logged yet</p>
            <Button asChild className="mt-4">
              <Link href={`/household/${id}/expense/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
