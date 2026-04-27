'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { UserPlus, Users, Trash2, Crown, Clock } from 'lucide-react'
import type { GroupMember } from '@/lib/types'

interface GroupMembersProps {
  groupId: string
  members: GroupMember[]
  isAdmin: boolean
  currentUserId: string
}

export function GroupMembers({ groupId, members, isAdmin, currentUserId }: GroupMembersProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isTemporary, setIsTemporary] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          name,
          email: email || null,
          is_temporary: isTemporary,
          role: 'member',
        })

      if (memberError) throw memberError

      // Log activity
      await supabase.from('activities').insert({
        group_id: groupId,
        user_id: user.id,
        action: 'create',
        entity_type: 'member',
        metadata: { name },
      })

      setName('')
      setEmail('')
      setIsTemporary(false)
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      await supabase.from('activities').insert({
        group_id: groupId,
        user_id: user.id,
        action: 'delete',
        entity_type: 'member',
        metadata: { name: memberName },
      })

      router.refresh()
    } catch (err) {
      console.error('Failed to remove member:', err)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
          <CardDescription>People in this group</CardDescription>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
                <DialogDescription>
                  Add someone to this group. Temporary members {"don't"} need an account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="memberName">Name</FieldLabel>
                  <Input
                    id="memberName"
                    placeholder="e.g., John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="memberEmail">Email (optional)</FieldLabel>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    They can join later using this email
                  </p>
                </Field>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Temporary member</p>
                      <p className="text-xs text-muted-foreground">{"Won't"} need an account</p>
                    </div>
                  </div>
                  <Switch
                    checked={isTemporary}
                    onCheckedChange={setIsTemporary}
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                    {loading ? <Spinner className="h-4 w-4" /> : 'Add Member'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const canRemove = isAdmin && !isCurrentUser && member.role !== 'admin'
            
            return (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {member.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                      {member.role === 'admin' && (
                        <Crown className="h-3.5 w-3.5 text-warning" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {member.email && <span>{member.email}</span>}
                      {member.is_temporary && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Temporary
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canRemove && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove member?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove {member.name} from the group. Any expenses they paid for will remain, but their balances will be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
