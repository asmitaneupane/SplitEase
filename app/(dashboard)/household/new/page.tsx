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
import { ArrowLeft, Sparkles, Shield, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default function NewHouseholdPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    currency: 'NPR',
  })
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: form.name,
          description: form.description || null,
          currency: form.currency,
          created_by: user.id,
        })
        .select()
        .single()

      if (householdError) throw householdError

      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          name: 'Owner',
          role: 'owner',
        })

      if (memberError) throw memberError

      router.push(`/household/${household.slug || household.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in-slide">
      {/* Luxury Minimalist Header */}
      <div className="relative p-10 rounded-[2rem] bg-white border border-black/5 shadow-sm overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
          <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-12 h-12 shrink-0">
            <Link href="/household">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3" />
              New Household
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              Create Household
            </h1>
            <p className="text-muted-foreground/60 text-sm font-medium">
              Establish a secure environment for tracking personal or family finances.
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
                  Space Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-70">Log Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Family Expenses, Personal Budget"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="h-12 rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 text-base font-bold transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest opacity-70">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add some context for this financial space..."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 font-medium transition-all resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-widest opacity-70">Base Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-black/10 focus:ring-primary/20 focus:border-primary/50 font-bold transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl p-2">
                      <SelectItem value="NPR" className="rounded-lg font-bold">NPR (Nepali Rupee)</SelectItem>
                      <SelectItem value="USD" className="rounded-lg font-bold">USD (US Dollar)</SelectItem>
                      <SelectItem value="EUR" className="rounded-lg font-bold">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP" className="rounded-lg font-bold">GBP (British Pound)</SelectItem>
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
                <CardTitle className="text-sm font-black uppercase tracking-widest">Privacy First</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <p className="text-xs font-medium text-muted-foreground/70 leading-relaxed">
                  Households are private by default. You can securely invite members from your circle after creation.
                </p>
                <div className="mt-8 pt-6 border-t border-black/5">
                   <p className="text-[9px] font-black uppercase tracking-widest text-primary">Status</p>
                   <p className="text-[10px] font-bold mt-1">Admin Access Guaranteed</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={loading || !form.name.trim()} size="elegant" className="h-14">
                {loading ? "Processing..." : "Finalize & Create"}
              </Button>
              <Button type="button" variant="ghost" asChild className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <Link href="/household">Discard</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
