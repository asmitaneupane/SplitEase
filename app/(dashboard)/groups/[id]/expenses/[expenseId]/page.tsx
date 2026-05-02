import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Trash2,
  Edit,
  Calendar,
  User,
  SplitSquareVertical,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { DeleteExpenseButton } from "@/components/groups/delete-expense-button";

interface ExpensePageProps {
  params: Promise<{ id: string; expenseId: string }>;
}

export default async function ExpensePage({ params }: ExpensePageProps) {
  const { id: groupId, expenseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get expense with splits
  const { data: expense } = await supabase
    .from("expenses")
    .select("*, expense_splits(*)")
    .eq("id", expenseId)
    .single();

  if (!expense) {
    notFound();
  }

  // Get group
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  // Get members
  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);

  const getMemberName = (memberId: string) => {
    const member = members?.find((m) => m.id === memberId);
    return member?.name ?? "Unknown";
  };

  const paidByMember = members?.find((m) => m.id === expense.paid_by);
  const canDelete = expense.created_by === user.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/groups/${groupId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {expense.description}
            </h1>
            <p className="text-muted-foreground">{group?.name}</p>
          </div>
        </div>
        {canDelete && (
          <DeleteExpenseButton
            expenseId={expenseId}
            groupId={groupId}
            expenseDescription={expense.description}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="outline" className="capitalize text-sm">
              {expense.category}
            </Badge>
          </div>
          <CardTitle className="text-3xl mt-4">
            {formatCurrency(expense.amount, expense.currency)}
          </CardTitle>
          <CardDescription>{expense.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Paid by</p>
                <p className="font-medium">{paidByMember?.name ?? "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(expense.date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          {expense.notes && (
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">Notes</p>
              <p>{expense.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-4">
              <SplitSquareVertical className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Split Details</h3>
              <Badge variant="secondary" className="ml-auto capitalize">
                {expense.split_type}
              </Badge>
            </div>
            <div className="space-y-2">
              {expense.expense_splits?.map(
                (split: {
                  id: string;
                  member_id: string;
                  amount: number;
                  percentage: number | null;
                  is_settled: boolean;
                }) => {
                  const isPayer = split.member_id === expense.paid_by;
                  return (
                    <div
                      key={split.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        split.is_settled
                          ? "border-success/30 bg-success/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {getMemberName(split.member_id)[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {getMemberName(split.member_id)}
                          </p>
                          {split.percentage && (
                            <p className="text-xs text-muted-foreground">
                              {split.percentage}%
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${isPayer ? "text-success" : ""}`}
                        >
                          {isPayer ? "Paid " : ""}
                          {formatCurrency(split.amount, expense.currency)}
                        </p>
                        {split.is_settled && (
                          <Badge
                            variant="outline"
                            className="text-xs text-success border-success/30"
                          >
                            Settled
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" asChild className="flex-1">
              <Link href={`/groups/${groupId}`}>Back to Group</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
