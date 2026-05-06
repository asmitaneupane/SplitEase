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

interface AddIncomePageProps {
  params: Promise<{ id: string }>;
}

interface Member {
  id: string;
  name: string;
  user_id?: string | null;
}

interface IncomeForm {
  member_id: string;
  amount: string;
  description: string;
  source: string;
  date: string;
  notes: string;
}

function getIncomeInsertErrorMessage(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";

  if (message.includes("household_income_logs")) {
    return "Household income table is missing. Run scripts/003_add_household_feature.sql in Supabase SQL Editor.";
  }

  return "Failed to add income";
}

export default function AddIncomePage({ params }: AddIncomePageProps) {
  const router = useRouter();
  const [householdId, setHouseholdId] = useState("");
  const [householdSlug, setHouseholdSlug] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<IncomeForm>({
    member_id: "",
    amount: "",
    description: "",
    source: "Salary",
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

      const { error } = await supabase.from("household_income_logs").insert({
        household_id: householdId,
        member_id: form.member_id,
        amount: Number(form.amount),
        description: form.description,
        source: form.source,
        date: form.date,
        notes: form.notes,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Income added successfully!");
      router.push(`/household/${householdId}`);
    } catch (error) {
      console.error("Error adding income:", error);
      toast.error(getIncomeInsertErrorMessage(error));
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
          <h1 className="text-2xl font-bold text-foreground">Add Income</h1>
          <p className="text-muted-foreground">
            Record income earned for this household
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Income Details</CardTitle>
            <CardDescription>
              Enter the income amount and information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="member">Who earned this? *</Label>
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
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="50000"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="Salary, Bonus, Gift, etc."
                  value={form.source}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, source: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <DualDatePicker
                  date={form.date}
                  onChange={(date) => setForm(prev => ({ ...prev, date }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly salary"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
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
            {loading ? "Adding..." : "Add Income"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/household/${householdSlug || householdId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
