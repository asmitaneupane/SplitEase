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

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("household_members")
        .select("id")
        .eq("household_id", householdId)
        .eq("email", newMemberEmail)
        .single();
        
      if (existingMember) {
        toast.error("User with this email is already a member");
        return;
      }

      // Check if user already has an account
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", newMemberEmail)
        .single();

      // Add member to household
      const { error } = await supabase.from("household_members").insert({
        household_id: householdId,
        user_id: profile ? profile.id : null,
        name: newMemberName,
        email: newMemberEmail,
        role: "member",
      });

      if (error) throw error;

      toast.success("Member added to the circle!");
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

      toast.success("Member removed from the circle");
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

      toast.success("Member role updated!");
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const isOwner = members.some(
    (m) => m.user_id === currentUser?.id && m.role === "owner",
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full glass" asChild>
            <Link href={`/household/${householdId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Circle Settings</h1>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Configure your shared financial universe</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Household Info */}
          <Card className="glass border-transparent shadow-xl overflow-hidden">
            <CardHeader className="bg-card/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">Identity</CardTitle>
                <CardDescription className="font-medium">Core details of this monthly log</CardDescription>
              </div>
              {isOwner && !editMode && (
                <Button size="sm" variant="ghost" className="rounded-full font-bold" onClick={() => setEditMode(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modify
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {!editMode ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</p>
                    <p className="text-lg font-bold">{household?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</p>
                    <p className="text-lg font-bold">{household?.currency}</p>
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Purpose</p>
                    <p className="text-sm font-medium italic text-muted-foreground">
                      {household?.description || "A shared financial journey."}
                    </p>
                  </div>
                </div>
              ) : (
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Title</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="glass rounded-xl h-12 border-transparent"
                      placeholder="The Dream House"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Purpose</Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="glass rounded-xl border-transparent"
                      placeholder="Optional notes..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Currency</Label>
                    <Select value={editCurrency} onValueChange={setEditCurrency}>
                      <SelectTrigger className="glass rounded-xl h-12 border-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="NPR">NPR (₨)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSaveHousehold} disabled={savingHousehold} className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">
                      {savingHousehold ? "Saving..." : "Update Circle"}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditMode(false)} className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px]">
                      Abort
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Members List */}
          <Card className="glass border-transparent shadow-xl overflow-hidden">
            <CardHeader className="bg-card/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black tracking-tight">The Circle ({members.length})</CardTitle>
                <CardDescription className="font-medium">Managing collaborators</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="group flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-card/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary shadow-inner">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-sm tracking-tight">{member.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && member.role !== "owner" ? (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(newRole) =>
                              handleChangeRole(member.id, newRole)
                            }
                          >
                            <SelectTrigger className="glass h-9 rounded-xl border-transparent text-[10px] font-black uppercase tracking-widest w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass">
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest h-6 px-3 bg-secondary/50">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Add Member */}
          {isOwner && (
            <Card className="glass border-transparent shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Invite Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMember} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Identity</Label>
                    <Input
                      placeholder="John Doe"
                      className="glass rounded-xl h-12 border-transparent"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Digital Mail</Label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      className="glass rounded-xl h-12 border-transparent"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={addingMember} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                    {addingMember ? "Expanding..." : "Add to Circle"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          {isOwner && (
            <Card className="glass border-destructive/20 bg-destructive/5 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-xs font-medium">Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 border border-destructive/20"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Terminate Circle
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass border-transparent shadow-2xl rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Terminate Circle?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-muted-foreground/80">
              This will permanently delete <strong>{household?.name}</strong>{" "}
              and all history. This cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
            <AlertDialogCancel disabled={deletingHousehold} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Preserve</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHousehold}
              disabled={deletingHousehold}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              {deletingHousehold ? "Terminating..." : "Terminate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
