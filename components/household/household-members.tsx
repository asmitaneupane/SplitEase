'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sendInvitationEmail } from '@/lib/email-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/field'
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
import { UserPlus, Users, Trash2, Crown, Mail, Settings } from 'lucide-react'
import type { HouseholdMember } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

interface HouseholdMembersProps {
  householdId: string
  householdName: string
  members: HouseholdMember[]
  isOwner: boolean
  currentUserId: string
  householdSlug?: string
}

export function HouseholdMembers({ 
  householdId, 
  householdName, 
  members, 
  isOwner, 
  currentUserId,
  householdSlug 
}: HouseholdMembersProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
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
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', householdId)
        .eq('email', email)
        .single()

      if (existingMember) {
        throw new Error('User with this email is already a member')
      }

      // Check if user already has an account
      let targetUserId = null
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      
      if (profile) {
        targetUserId = profile.id
      }

      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: targetUserId,
          name,
          email,
          role: 'member',
        })

      if (memberError) throw memberError

      // Send invitation email
      await sendInvitationEmail({
        to: email,
        inviterName: user.user_metadata?.full_name || user.email || 'Someone',
        groupName: householdName,
        type: 'household'
      })

      // Log activity
      await supabase.from('activities').insert({
        household_id: householdId,
        user_id: user.id,
        action: 'create',
        entity_type: 'member',
        metadata: { name },
      })

      setName('')
      setEmail('')
      setOpen(false)
      toast.success('Member added successfully')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add member'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      await supabase.from('activities').insert({
        household_id: householdId,
        user_id: user.id,
        action: 'delete',
        entity_type: 'member',
        metadata: { name: memberName },
      })

      toast.success('Member removed')
      router.refresh()
    } catch (err) {
      console.error('Failed to remove member:', err)
      toast.error('Failed to remove member')
    }
  }

  return (
    <Card className="glass border-transparent shadow-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-card/30 pb-6">
        <div>
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">
            The Circle
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-tighter opacity-50">
            {members.length} Active Collaborators
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 text-primary transition-colors">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#f8faff] border border-blue-100/50 shadow-2xl rounded-[2rem] max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tight">Expand the Circle</DialogTitle>
                  <DialogDescription className="font-medium text-muted-foreground/80">
                    Invite contributors to this household.
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
                    <FieldLabel htmlFor="memberEmail" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</FieldLabel>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="john@example.com"
                      className="bg-background/50 border-border/50 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
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
                    <Button type="submit" disabled={loading || !name.trim() || !email.trim()} className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                      {loading ? <Spinner className="h-4 w-4" /> : 'Confirm Invite'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {isOwner && (
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full border border-black/5">
              <Link href={`/household/${householdSlug || householdId}/settings`}>
                <Settings className="h-4 w-4 text-muted-foreground/50" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="space-y-1">
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const canRemove = isOwner && !isCurrentUser && member.role !== 'owner'
            
            return (
              <div
                key={member.id}
                className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all relative overflow-hidden"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      {member.name[0].toUpperCase()}
                    </div>
                    {member.role === 'owner' && (
                      <div className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full border border-border shadow-sm">
                        <Crown className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm tracking-tight">{member.name}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4">You</Badge>
                      )}
                    </div>
                    <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-0.5 truncate max-w-[120px]">
                      {member.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {canRemove && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#f8faff] border border-blue-100/50 shadow-2xl rounded-[2rem] max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-black tracking-tight text-slate-900">Remove Member?</AlertDialogTitle>
                          <AlertDialogDescription className="font-medium text-slate-500">
                            Remove {member.name} from the circle. Their recorded history will remain.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2 sm:gap-0 pt-4">
                          <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest h-5 px-2 bg-slate-50 border border-black/5">
                    {member.role}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
