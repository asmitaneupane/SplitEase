import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Plus, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface IncomePageProps {
  params: Promise<{ id: string }>;
}

export default async function HouseholdIncomePage({ params }: IncomePageProps) {
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

  // Get income logs
  const { data: incomeLogs } = await supabase
    .from("household_income_logs")
    .select("*, household_members(name)")
    .eq("household_id", id)
    .order("date", { ascending: false });

  const totalIncome =
    incomeLogs?.reduce((sum, log) => sum + Number(log.amount), 0) || 0;

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
            <h1 className="text-2xl font-bold text-foreground">Income Logs</h1>
            <p className="text-muted-foreground">{household.name}</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/household/${id}/income/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-success">
            {formatCurrency(totalIncome, household.currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            From {incomeLogs?.length || 0} income entries
          </p>
        </CardContent>
      </Card>

      {/* Income List */}
      {incomeLogs && incomeLogs.length > 0 ? (
        <div className="space-y-2">
          {incomeLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {log.description || `Income from ${log.source}`}
                      </p>
                      {log.source && (
                        <Badge variant="secondary" className="text-xs">
                          {log.source}
                        </Badge>
                      )}
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
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No income logged yet</p>
            <Button asChild className="mt-4">
              <Link href={`/household/${id}/income/new`}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Income
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
