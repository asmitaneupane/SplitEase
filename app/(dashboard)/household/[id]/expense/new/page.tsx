"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DualDatePicker } from "@/components/ui/nepali-date-picker";

interface AddExpensePageProps {
  params: Promise<{ id: string }>;
}

interface Member {
  id: string;
  name: string;
  user_id?: string | null;
}

interface ExpenseForm {
  member_id: string;
  amount: string;
  description: string;
  category: string;
  date: string;
  notes: string;
}

function getExpenseInsertErrorMessage(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("household_expense_logs")) {
    return "Household expense table is missing. Run scripts/003_add_household_feature.sql in Supabase SQL Editor.";
  }

  return "Failed to add expense";
}

const EXPENSE_CATEGORIES = [
  "Food & Groceries",
  "Utilities",
  "Rent/Mortgage",
  "Transportation",
  "Healthcare",
  "Insurance",
  "Education",
  "Entertainment",
  "Shopping",
  "Home Maintenance",
  "Childcare",
  "Pet Care",
  "Dining Out",
  "Subscriptions",
  "Other",
];

export default function AddExpensePage({ params }: AddExpensePageProps) {
  const router = useRouter();
  const [householdId, setHouseholdId] = useState("");
  const [householdSlug, setHouseholdSlug] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [form, setForm] = useState<ExpenseForm>({
    member_id: "",
    amount: "",
    description: "",
    category: "Food & Groceries",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { id: idOrSlug } = await params;
      const supabase = createClient();
      
      // Robust lookup (supports ID or Slug)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
      let householdData;

      if (isUUID) {
        const { data } = await supabase.from("households").select("id, slug").eq("id", idOrSlug).single();
        householdData = data;
      }

      if (!householdData) {
        // Try by slug
        const { data } = await supabase.from("households").select("id, slug").eq("slug", idOrSlug).single();
        householdData = data;
      }

      if (!householdData) return;
      
      setHouseholdId(householdData.id);
      setHouseholdSlug(householdData.slug);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: memberData } = await supabase
        .from("household_members")
        .select("id, name, user_id")
        .eq("household_id", householdData.id);

      if (memberData && memberData.length > 0) {
        setMembers(memberData);
        const currentUserMember = user
          ? memberData.find((member) => member.user_id === user.id)
          : undefined;
        setForm((prev) => ({
          ...prev,
          member_id: currentUserMember?.id || memberData[0].id,
        }));
      }
    })();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.member_id) {
        toast.error("Please select a member");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      if (isCustomCategory && !customCategory.trim()) {
        toast.error("Please enter a custom category name");
        setLoading(false);
        return;
      }

      const finalCategory = isCustomCategory ? customCategory.trim() : form.category;

      const { error } = await supabase.from("household_expense_logs").insert({
        household_id: householdId,
        member_id: form.member_id,
        amount: Number(form.amount),
        description: form.description,
        category: finalCategory,
        date: form.date,
        notes: form.notes,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Expense added successfully!");
      router.push(`/household/${householdId}`);
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error(getExpenseInsertErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/household/${householdSlug || householdId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Expense</h1>
          <p className="text-muted-foreground">
            Record an expense for this household
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Enter the expense information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="member">Who spent this? *</Label>
              <Select
                value={form.member_id}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, member_id: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={isCustomCategory ? "custom" : form.category}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setIsCustomCategory(true);
                      setCustomCategory("");
                    } else {
                      setIsCustomCategory(false);
                      setForm((prev) => ({ ...prev, category: value }));
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-primary font-bold">
                      + Custom Category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    placeholder="Enter custom category name"
                    className="mt-2"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <DualDatePicker
                date={form.date}
                onChange={(date) => setForm(prev => ({ ...prev, date }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details..."
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Adding..." : "Add Expense"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/household/${householdSlug || householdId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
