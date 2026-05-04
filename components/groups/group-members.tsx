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
import { UserPlus, Users, Trash2, Crown, Clock, Mail } from 'lucide-react'
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

      // Check if user is already a member
      if (email) {
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupId)
          .eq('email', email)
          .single()

        if (existingMember) {
          throw new Error('User with this email is already a member')
        }
      }

      // Check if user already has an account
      let targetUserId = null
      if (email && !isTemporary) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single()
        
        if (profile) {
          targetUserId = profile.id
        }
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: targetUserId,
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
    <Card className="glass border-transparent shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-card/30 pb-6">
        <div>
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Circle ({members.length})
          </CardTitle>
          <CardDescription className="font-medium">Active collaborators in this group</CardDescription>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full font-bold shadow-lg shadow-primary/20">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-transparent shadow-2xl rounded-3xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Expand the Circle</DialogTitle>
                <DialogDescription className="font-medium text-muted-foreground/80">
                  Invite friends to start splitting expenses.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember} className="space-y-6 pt-4">
                <div className="space-y-2">
                  <FieldLabel htmlFor="memberName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</FieldLabel>
                  <Input
                    id="memberName"
                    placeholder="e.g., John Doe"
                    className="bg-background/50 border-border/50 rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="memberEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address (Optional)</FieldLabel>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="john@example.com"
                    className="bg-background/50 border-border/50 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-[9px] text-muted-foreground ml-1 font-bold uppercase tracking-tighter italic">
                    Required for account synchronization
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                       <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Ghost Member</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter italic">No account required</p>
                    </div>
                  </div>
                  <Switch
                    checked={isTemporary}
                    onCheckedChange={setIsTemporary}
                  />
                </div>

                {error && (
                  <div className="p-3 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !name.trim()} className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                    {loading ? <Spinner className="h-4 w-4" /> : 'Confirm Invite'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const canRemove = isAdmin && !isCurrentUser && member.role !== 'admin'
            
            return (
              <div
                key={member.id}
                className="group flex items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-card/50 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 w-1 h-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <span className="text-sm font-black text-primary">
                        {member.name[0].toUpperCase()}
                      </span>
                    </div>
                    {member.role === 'admin' && (
                      <div className="absolute -top-1 -right-1 p-1 bg-background rounded-full border border-border">
                        <Crown className="h-2.5 w-2.5 text-warning fill-warning" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black tracking-tight text-sm">{member.name}</span>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4">Host</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold mt-0.5">
                      {member.email ? (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                      ) : (
                        <span className="italic">No digital identity</span>
                      )}
                      {member.is_temporary && (
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-primary/20 text-primary px-1.5 h-4 bg-primary/5">
                          Ghost
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canRemove && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass border-transparent shadow-2xl rounded-3xl max-w-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black tracking-tight">Expel Member?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-muted-foreground/80">
                          This will remove {member.name} from the circle. Expenses will remain, but balances will lock.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
                        <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Retain</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                          Expel
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
