"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Edit2, Trash2, AlertCircle, Loader2, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/currency";

interface HouseholdActionsProps {
  householdId: string;
  householdName: string;
  householdDescription: string | null;
  householdCurrency: string;
  isOwner: boolean;
}

export function HouseholdActions({
  householdId,
  householdName,
  householdDescription,
  householdCurrency,
  isOwner,
}: HouseholdActionsProps) {
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editName, setEditName] = useState(householdName);
  const [editDescription, setEditDescription] = useState(
    householdDescription || "",
  );
  const [editCurrency, setEditCurrency] = useState(householdCurrency);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
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
      router.refresh();
      setShowEditDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update household");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("households")
        .delete()
        .eq("id", householdId);

      if (error) throw error;

      toast.success("Household deleted successfully!");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete household");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white border-black/5 shadow-lg">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            setShowEditDialog(true);
          }} className="cursor-pointer">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Info
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={`/household/${householdId}/settings`} onClick={(e) => e.stopPropagation()}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Circle
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Household
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle>Edit Household</DialogTitle>
            <DialogDescription>
              Update the details of your household space.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Household Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="bg-white/5 border-white/10"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving} className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-rose-100 shadow-2xl shadow-rose-500/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 font-black text-xl">
              <AlertCircle className="h-5 w-5" />
              Delete Household?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900">"{householdName}"</span>? 
              This will permanently remove all transaction history and member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={deleting} className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-full px-8 shadow-md shadow-rose-500/20 font-bold"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Household"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
