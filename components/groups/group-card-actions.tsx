'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  AlertCircle,
  Settings,
  Edit2
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import Link from 'next/link'
import { CURRENCIES } from '@/lib/currency'

interface GroupCardActionsProps {
  groupId: string
  groupSlug: string | null
  groupName: string
  groupDescription: string | null
  groupCurrency: string
  isOwner?: boolean
}

export function GroupCardActions({ 
  groupId, 
  groupSlug, 
  groupName,
  groupDescription,
  groupCurrency,
  isOwner = false
}: GroupCardActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [editName, setEditName] = useState(groupName)
  const [editDescription, setEditDescription] = useState(groupDescription || "")
  const [editCurrency, setEditCurrency] = useState(groupCurrency)

  const router = useRouter()
  const supabase = createClient()

  const handleEdit = async () => {
    if (!editName.trim()) {
      toast.error("Group name cannot be empty")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: editName,
          description: editDescription || null,
          currency: editCurrency,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)

      if (error) throw error

      toast.success('Group updated successfully')
      setShowEditDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Failed to update group')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      toast.success('Group deleted successfully')
      router.refresh()
    } catch (error) {
      console.error('Error deleting group:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete group')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 glass border-border/50">
          <DropdownMenuItem onClick={(e) => {
            e.preventDefault()
            setShowEditDialog(true)
          }} className="cursor-pointer">
            <Edit2 className="mr-2 h-4 w-4" />
            <span>Edit Info</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/groups/${groupSlug || groupId}/settings`} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage Group</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/30" />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive cursor-pointer"
            onSelect={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Group</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#f8faff] border border-blue-100/50 shadow-2xl rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update the details of your group.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/5 border-border/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea
                id="group-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="bg-white/5 border-border/30"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-currency">Currency</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger className="bg-white/5 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#f8faff] border border-blue-100/50 shadow-2xl rounded-[2rem]">
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
            <Button onClick={handleEdit} disabled={saving} className="rounded-full px-8">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border-rose-100 shadow-2xl shadow-rose-500/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 font-black text-xl">
              <AlertCircle className="h-5 w-5" />
              Delete Group?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
              Are you sure you want to delete <span className="font-black text-slate-900">"{groupName}"</span>? 
              This action cannot be undone and will remove all expenses and member history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel disabled={deleting} className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-full px-8 shadow-md shadow-rose-500/20 font-bold"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Group'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
