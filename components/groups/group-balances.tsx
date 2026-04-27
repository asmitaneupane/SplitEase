'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TrendingUp, ArrowRight, CheckCircle2, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import type { GroupMember, Expense, ExpenseSplit, Settlement } from '@/lib/types'

interface GroupBalancesProps {
  groupId: string
  members: GroupMember[]
  expenses: (Expense & { expense_splits: ExpenseSplit[] })[]
  settlements: Settlement[]
  currency: string
  currentUserId: string
}

interface DebtEntry {
  from: GroupMember
  to: GroupMember
  amount: number
}

export function GroupBalances({ 
  groupId, 
  members, 
  expenses, 
  settlements, 
  currency,
  currentUserId 
}: GroupBalancesProps) {
  const [settleOpen, setSettleOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<DebtEntry | null>(null)
  const [settleAmount, setSettleAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Calculate net balances for each member
  const balanceMap = new Map<string, number>()
  
  // Initialize all members with 0
  members.forEach((m) => {
    balanceMap.set(m.id, 0)
  })

  // Process expenses
  expenses.forEach((expense) => {
    const payerId = expense.paid_by
    const payerBalance = balanceMap.get(payerId) ?? 0
    balanceMap.set(payerId, payerBalance + Number(expense.amount))

    expense.expense_splits?.forEach((split) => {
      const memberBalance = balanceMap.get(split.member_id) ?? 0
      balanceMap.set(split.member_id, memberBalance - Number(split.amount))
    })
  })

  // Process settlements
  settlements.forEach((settlement) => {
    const fromBalance = balanceMap.get(settlement.from_member) ?? 0
    const toBalance = balanceMap.get(settlement.to_member) ?? 0
    balanceMap.set(settlement.from_member, fromBalance + Number(settlement.amount))
    balanceMap.set(settlement.to_member, toBalance - Number(settlement.amount))
  })

  // Calculate simplified debts using minimum transactions algorithm
  const creditors: { member: GroupMember; amount: number }[] = []
  const debtors: { member: GroupMember; amount: number }[] = []

  members.forEach((member) => {
    const balance = balanceMap.get(member.id) ?? 0
    if (balance > 0.01) {
      creditors.push({ member, amount: balance })
    } else if (balance < -0.01) {
      debtors.push({ member, amount: Math.abs(balance) })
    }
  })

  // Sort by amount descending
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  // Generate simplified debts
  const debts: DebtEntry[] = []
  let i = 0, j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount > 0.01) {
      debts.push({
        from: debtor.member,
        to: creditor.member,
        amount,
      })
    }

    debtor.amount -= amount
    creditor.amount -= amount

    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  const handleSettle = async () => {
    if (!selectedDebt) return
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const amount = parseFloat(settleAmount)
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount')

      const { error } = await supabase
        .from('settlements')
        .insert({
          group_id: groupId,
          from_member: selectedDebt.from.id,
          to_member: selectedDebt.to.id,
          amount,
          currency,
          notes: notes || null,
          created_by: user.id,
        })

      if (error) throw error

      await supabase.from('activities').insert({
        group_id: groupId,
        user_id: user.id,
        action: 'settle',
        entity_type: 'settlement',
        metadata: {
          from: selectedDebt.from.name,
          to: selectedDebt.to.name,
          amount: formatCurrency(amount, currency),
        },
      })

      setSettleOpen(false)
      setSelectedDebt(null)
      setSettleAmount('')
      setNotes('')
      router.refresh()
    } catch (err) {
      console.error('Failed to settle:', err)
    } finally {
      setLoading(false)
    }
  }

  const currentMember = members.find((m) => m.user_id === currentUserId)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Simplified Balances
          </CardTitle>
          <CardDescription>Minimum transactions to settle all debts</CardDescription>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <Empty
              icon={<CheckCircle2 className="h-10 w-10 text-success" />}
              title="All settled up!"
              description="No outstanding debts in this group"
            />
          ) : (
            <div className="space-y-3">
              {debts.map((debt, index) => {
                const isCurrentUserInvolved = 
                  debt.from.user_id === currentUserId || 
                  debt.to.user_id === currentUserId
                const canSettle = debt.from.user_id === currentUserId || 
                  (currentMember && debt.from.id === currentMember.id)

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUserInvolved 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-destructive">
                          {debt.from.name[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{debt.from.name}</p>
                        <p className="text-sm text-muted-foreground">owes</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="font-semibold text-lg">
                        {formatCurrency(debt.amount, currency)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-right">{debt.to.name}</p>
                        <p className="text-sm text-muted-foreground text-right">receives</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-success">
                          {debt.to.name[0].toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {canSettle && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDebt(debt)
                          setSettleAmount(debt.amount.toFixed(2))
                          setSettleOpen(true)
                        }}
                        className="ml-4"
                      >
                        <Wallet className="h-4 w-4 mr-1" />
                        Settle
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={settleOpen} onOpenChange={setSettleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Settlement</DialogTitle>
            <DialogDescription>
              Record a payment from {selectedDebt?.from.name} to {selectedDebt?.to.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="settleAmount">Amount</FieldLabel>
              <Input
                id="settleAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Full amount owed: {formatCurrency(selectedDebt?.amount ?? 0, currency)}
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="settleNotes">Notes (optional)</FieldLabel>
              <Input
                id="settleNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Bank transfer"
              />
            </Field>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSettleOpen(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSettle} 
                disabled={loading || !settleAmount} 
                className="flex-1"
              >
                {loading ? <Spinner className="h-4 w-4" /> : 'Record Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
