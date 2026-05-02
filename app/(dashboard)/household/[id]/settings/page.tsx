"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Trash2, Plus, Edit2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

export default function HouseholdSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const householdId = params.id as string;

  const [household, setHousehold] = useState<any>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCurrency, setEditCurrency] = useState("NPR");
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [deletingHousehold, setDeletingHousehold] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadHousehold();
    loadMembers();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadHousehold = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .single();

      if (error) throw error;
      setHousehold(data);
      setEditName(data.name);
      setEditDescription(data.description || "");
      setEditCurrency(data.currency || "NPR");
    } catch (error) {
      toast.error("Failed to load household");
      console.error(error);
    }
  };

  const loadMembers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", householdId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      toast.error("Failed to load members");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHousehold = async () => {
    if (!editName.trim()) {
      toast.error("Household name cannot be empty");
      return;
    }

    setSavingHousehold(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("households")
        .update({
          name: editName,
          description: editDescription || null,
          currency: editCurrency,
        })
        .eq("id", householdId);

      if (error) throw error;

      toast.success("Household updated successfully!");
      setEditMode(false);
      await loadHousehold();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update household";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSavingHousehold(false);
    }
  };

  const handleDeleteHousehold = async () => {
    setDeletingHousehold(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("households")
        .delete()
        .eq("id", householdId);

      if (error) throw error;

      toast.success("Household deleted successfully!");
      router.push("/household");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete household";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setDeletingHousehold(false);
      setShowDeleteDialog(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);

    try {
      if (!newMemberName.trim() || !newMemberEmail.trim()) {
        toast.error("Please fill in all fields");
        return;
      }

      const supabase = createClient();

      // Add member to household (user_id will be set when they sign up with this email)
      const { error } = await supabase.from("household_members").insert({
        household_id: householdId,
        user_id: null, // Will be linked when user signs up with this email
        name: newMemberName,
        email: newMemberEmail,
        role: "member",
      });

      if (error) throw error;

      toast.success("Member added successfully!");
      setNewMemberName("");
      setNewMemberEmail("");
      await loadMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add member";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member removed successfully!");
      await loadMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove member";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("household_members")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;

      toast.success("Member role updated successfully!");
      await loadMembers();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update member role";
      toast.error(errorMessage);
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const isOwner = members.some(
    (m) => m.user_id === currentUser?.id && m.role === "owner",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/household/${householdId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Household Settings</h1>
        </div>
      </div>

      {/* Household Edit Section */}
      {isOwner && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Household Information</CardTitle>
              <CardDescription>Edit basic household details</CardDescription>
            </div>
            {!editMode && (
              <Button size="sm" onClick={() => setEditMode(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!editMode ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Name
                  </p>
                  <p className="text-lg font-semibold">{household?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="text-sm">
                    {household?.description || "No description"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Currency
                  </p>
                  <p className="text-sm">{household?.currency}</p>
                </div>
              </div>
            ) : (
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Household Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., John & Sarah's Household"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Optional: Add notes about this household"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Select value={editCurrency} onValueChange={setEditCurrency}>
                    <SelectTrigger id="edit-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NPR">NPR (₨)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveHousehold}
                    disabled={savingHousehold}
                  >
                    {savingHousehold ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Member Section */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Member
            </CardTitle>
            <CardDescription>
              Invite someone to join this household
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Member Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={addingMember}>
                {addingMember ? "Adding..." : "Add Member"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Household Members ({members.length})</CardTitle>
          <CardDescription>Manage members of this household</CardDescription>
        </CardHeader>
        <CardContent>
          {members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>

                  {isOwner && member.role !== "owner" && (
                    <div className="flex items-center gap-2 ml-4">
                      <Select
                        value={member.role}
                        onValueChange={(newRole) =>
                          handleChangeRole(member.id, newRole)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {isOwner && member.role === "owner" && (
                    <div className="text-sm font-medium text-muted-foreground">
                      Owner
                    </div>
                  )}

                  {!isOwner && (
                    <div className="text-sm font-medium text-muted-foreground capitalize">
                      {member.role}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No members in this household yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Household Section */}
      {isOwner && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this household and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Household
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Household?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{household?.name}</strong>{" "}
              and all associated data including members, income, and expenses.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel disabled={deletingHousehold}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteHousehold}
            disabled={deletingHousehold}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deletingHousehold ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
