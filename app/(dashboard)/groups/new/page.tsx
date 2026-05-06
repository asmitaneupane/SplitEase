'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CURRENCIES } from '@/lib/currency'
import { ArrowLeft, Users, Sparkles, LayoutGrid, Shield } from 'lucide-react'
import Link from 'next/link'

export default function NewGroupPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('NPR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description: description || null,
          currency,
          created_by: user.id,
        })
        .select()
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          name: profile?.full_name || user.email || 'User',
          email: profile?.email || user.email,
          is_temporary: false,
          role: 'admin',
        })

      if (memberError) throw memberError

      await supabase.from('activities').insert({
        group_id: group.id,
        user_id: user.id,
        action: 'create',
        entity_type: 'group',
        entity_id: group.id,
        metadata: { name: group.name },
      })

      router.push(`/groups/${group.slug || group.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in-slide">
      {/* Luxury Minimalist Header */}
      <div className="relative p-10 rounded-[2rem] bg-white border border-black/5 shadow-sm overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-12 h-12 shrink-0">
            <Link href="/groups">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mb-4">
              <Users className="h-3 w-3" />
              Shared Space
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Start New Group
            </h1>
            <p className="text-muted-foreground/60 text-sm font-medium">
              Create a shared environment to track expenses with friends and colleagues.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
            <Card className="border-black/5 shadow-sm overflow-hidden">
              <CardHeader className="p-8 border-b border-black/5 bg-black/[0.01]">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 opacity-50">
                  <LayoutGrid className="h-4 w-4" />
                  Group Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-70">Group Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Pokhara Trip, Room 402, Project Alpha"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 text-base font-bold transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest opacity-70">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What are these expenses for? Add context for the members..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 font-medium transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-widest opacity-70">Group Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12 rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 font-bold transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl p-2 max-h-[300px]">
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code} className="rounded-lg font-bold">
                          {c.symbol} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <div className="p-4 text-xs font-bold text-destructive bg-destructive/5 border border-destructive/10 rounded-xl">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-black/5 shadow-sm bg-black/[0.01]">
              <CardHeader className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                   <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-widest">Admin Control</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-xs font-medium text-muted-foreground/70 leading-relaxed">
                  As the creator, you will have administrative privileges to manage members, settle balances, and edit settings.
                </p>
                <div className="mt-8 pt-6 border-t border-black/5">
                   <p className="text-[9px] font-black uppercase tracking-widest text-primary">Role</p>
                   <p className="text-[10px] font-bold mt-1">Super Administrator</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={loading || !name.trim()} size="elegant" className="h-14">
                {loading ? "Processing..." : "Initialize Group"}
              </Button>
              <Button type="button" variant="ghost" asChild className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Link href="/groups">Discard Changes</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
