'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EXPENSE_CATEGORIES } from '@/lib/types'
import { formatCurrency } from '@/lib/currency'
import { ArrowLeft, Receipt } from 'lucide-react'
import Link from 'next/link'
import type { GroupMember, Group } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function NewExpensePage({ params }: PageProps) {
  const { id: groupId } = use(params)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('general')
  const [paidBy, setPaidBy] = useState('')
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})
  const [percentages, setPercentages] = useState<Record<string, string>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [groupRes, membersRes] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('group_members').select('*').eq('group_id', groupId).order('joined_at'),
      ])

      if (groupRes.data) setGroup(groupRes.data)
      if (membersRes.data) {
        setMembers(membersRes.data)
        const currentMember = membersRes.data.find((m) => m.user_id === user.id)
        if (currentMember) {
          setPaidBy(currentMember.id)
        }
        // Select all members by default
        setSelectedMembers(new Set(membersRes.data.map((m) => m.id)))
      }
      setFetchingData(false)
    }
    fetchData()
  }, [groupId, supabase])

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const calculateSplits = () => {
    const totalAmount = parseFloat(amount) || 0
    const selected = Array.from(selectedMembers)
    
    if (splitType === 'equal') {
      const perPerson = totalAmount / selected.length
      return selected.map((memberId) => ({
        member_id: memberId,
        amount: perPerson,
        percentage: (100 / selected.length),
      }))
    } else if (splitType === 'exact') {
      return selected.map((memberId) => ({
        member_id: memberId,
        amount: parseFloat(exactAmounts[memberId] || '0'),
        percentage: null,
      }))
    } else {
      return selected.map((memberId) => {
        const pct = parseFloat(percentages[memberId] || '0')
        return {
          member_id: memberId,
          amount: (totalAmount * pct) / 100,
          percentage: pct,
        }
      })
    }
  }

  const totalExact = Object.values(exactAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
  const totalPercentage = Object.values(percentages).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const totalAmount = parseFloat(amount)
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new Error('Invalid amount')
      }

      if (selectedMembers.size === 0) {
        throw new Error('Select at least one member to split with')
      }

      if (splitType === 'exact' && Math.abs(totalExact - totalAmount) > 0.01) {
        throw new Error('Exact amounts must equal the total')
      }

      if (splitType === 'percentage' && Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error('Percentages must add up to 100%')
      }

      if (isCustomCategory && !customCategory.trim()) {
        throw new Error('Please enter a custom category name')
      }

      const finalCategory = isCustomCategory ? customCategory.trim() : category

      // Create expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          description,
          amount: totalAmount,
          currency: group?.currency || 'NPR',
          category: finalCategory,
          paid_by: paidBy,
          split_type: splitType,
          date,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (expenseError) throw expenseError

      // Create splits
      const splits = calculateSplits()
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(
          splits.map((split) => ({
            expense_id: expense.id,
            member_id: split.member_id,
            amount: split.amount,
            percentage: split.percentage,
          }))
        )

      if (splitsError) throw splitsError

      // Log activity
      await supabase.from('activities').insert({
        group_id: groupId,
        user_id: user.id,
        action: 'create',
        entity_type: 'expense',
        entity_id: expense.id,
        metadata: { 
          description, 
          amount: formatCurrency(totalAmount, group?.currency || 'NPR'),
        },
      })

      // Update group timestamp
      await supabase
        .from('groups')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', groupId)

      router.push(`/groups/${groupId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create expense')
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const perPersonAmount = selectedMembers.size > 0 
    ? (parseFloat(amount) || 0) / selectedMembers.size 
    : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/groups/${groupId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Expense</h1>
          <p className="text-muted-foreground">{group?.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>What did you pay for?</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Input
                  id="description"
                  placeholder="e.g., Dinner at restaurant"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="amount">Amount ({group?.currency})</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="category">Category</FieldLabel>
                <Select 
                  value={isCustomCategory ? 'custom' : category} 
                  onValueChange={(v) => {
                    if (v === 'custom') {
                      setIsCustomCategory(true)
                      setCustomCategory('')
                    } else {
                      setIsCustomCategory(false)
                      setCategory(v)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-primary font-bold">
                      + Add New Category
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCategory && (
                  <Input
                    placeholder="Category name"
                    className="mt-2"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    autoFocus
                  />
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="paidBy">Paid by</FieldLabel>
                <Select value={paidBy} onValueChange={setPaidBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select who paid" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="date">Date</FieldLabel>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-4">
              <FieldLabel>Split between</FieldLabel>
              
              <Tabs value={splitType} onValueChange={(v) => setSplitType(v as typeof splitType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="equal">Equal</TabsTrigger>
                  <TabsTrigger value="exact">Exact</TabsTrigger>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                </TabsList>

                <TabsContent value="equal" className="space-y-3 mt-4">
                  {selectedMembers.size > 0 && amount && (
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(perPersonAmount, group?.currency || 'NPR')} per person
                    </p>
                  )}
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <span className="flex-1 font-medium">{member.name}</span>
                      {selectedMembers.has(member.id) && amount && (
                        <span className="text-muted-foreground">
                          {formatCurrency(perPersonAmount, group?.currency || 'NPR')}
                        </span>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="exact" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(totalExact, group?.currency || 'NPR')} of {formatCurrency(parseFloat(amount) || 0, group?.currency || 'NPR')}
                    {Math.abs(totalExact - (parseFloat(amount) || 0)) > 0.01 && (
                      <span className="text-destructive ml-2">
                        (Difference: {formatCurrency(Math.abs(totalExact - (parseFloat(amount) || 0)), group?.currency || 'NPR')})
                      </span>
                    )}
                  </p>
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <span className="flex-1 font-medium">{member.name}</span>
                      {selectedMembers.has(member.id) && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-28"
                          placeholder="0.00"
                          value={exactAmounts[member.id] || ''}
                          onChange={(e) => setExactAmounts((prev) => ({
                            ...prev,
                            [member.id]: e.target.value,
                          }))}
                        />
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="percentage" className="space-y-3 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Total: {totalPercentage.toFixed(1)}%
                    {Math.abs(totalPercentage - 100) > 0.01 && (
                      <span className="text-destructive ml-2">(Must equal 100%)</span>
                    )}
                  </p>
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <span className="flex-1 font-medium">{member.name}</span>
                      {selectedMembers.has(member.id) && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-20"
                            placeholder="0"
                            value={percentages[member.id] || ''}
                            onChange={(e) => setPercentages((prev) => ({
                              ...prev,
                              [member.id]: e.target.value,
                            }))}
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            <Field>
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </Field>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" asChild className="flex-1">
                <Link href={`/groups/${groupId}`}>Cancel</Link>
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !description.trim() || !amount || !paidBy || selectedMembers.size === 0} 
                className="flex-1"
              >
                {loading ? <Spinner className="h-4 w-4" /> : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
