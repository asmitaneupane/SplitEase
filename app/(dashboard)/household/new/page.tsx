"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

interface NewHouseholdForm {
  name: string;
  description: string;
  currency: string;
  partnerEmail?: string;
}

export default function NewHouseholdPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewHouseholdForm>({
    name: "",
    description: "",
    currency: "NPR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.name.trim()) {
        toast.error("Please enter a household name");
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

      // DEBUG: Check if session exists
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("User ID:", user.id);
      console.log("Session:", session);
      console.log("Session token exists:", !!session?.access_token);

      if (!session) {
        toast.error("No active session. Please log in again.");
        return;
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from("households")
        .insert({
          name: form.name,
          description: form.description || null,
          currency: form.currency,
          created_by: user.id,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add current user as owner
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email || "Owner",
          email: user.email,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast.success("Household created successfully!");
      router.push(`/household/${household.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : JSON.stringify(error);

      console.error("Error creating household:", errorMessage);
      toast.error(`Failed to create household: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/household">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Create Household
          </h1>
          <p className="text-muted-foreground">
            Set up a private space for shared finances
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Household Information */}
        <Card>
          <CardHeader>
            <CardTitle>Household Details</CardTitle>
            <CardDescription>
              Create a household for managing shared finances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Household Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 'Our Home', 'Family Finances'"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Add a description... (optional)"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NPR">NPR (Nepali Rupee)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                  <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                  <SelectItem value="AUD">AUD (Australian Dollar)</SelectItem>
                  <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm text-foreground">
              <strong>💡 Tip:</strong> You can add members to this household
              after creation. You'll be set as the owner by default.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create Household"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/household">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
