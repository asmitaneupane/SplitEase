'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { formatCurrency } from '@/lib/currency'
import type { GroupMember, Expense, ExpenseSplit, Settlement } from '@/lib/types'
import { ArrowRight, Wallet } from 'lucide-react'

interface BalanceSummaryProps {
  userMemberIds: string[]
  allMembers: GroupMember[]
  expenses: (Expense & { expense_splits: ExpenseSplit[] })[]
  settlements: Settlement[]
}

interface PersonBalance {
  member: GroupMember
  amount: number // positive = they owe user, negative = user owes them
}

export function BalanceSummary({ userMemberIds, allMembers, expenses, settlements }: BalanceSummaryProps) {
  // Calculate per-person balances
  const balanceMap = new Map<string, number>()

  expenses.forEach((expense) => {
    const isPayer = userMemberIds.includes(expense.paid_by)
    
    expense.expense_splits?.forEach((split) => {
      if (split.is_settled) return
      
      if (isPayer && !userMemberIds.includes(split.member_id)) {
        // User paid, this person owes user
        const current = balanceMap.get(split.member_id) ?? 0
        balanceMap.set(split.member_id, current + Number(split.amount))
      } else if (!isPayer && userMemberIds.includes(split.member_id)) {
        // This expense's payer is owed by user
        const payerId = expense.paid_by
        const current = balanceMap.get(payerId) ?? 0
        balanceMap.set(payerId, current - Number(split.amount))
      }
    })
  })

  // Adjust for settlements
  settlements.forEach((settlement) => {
    if (userMemberIds.includes(settlement.from_member)) {
      // User paid someone
      const current = balanceMap.get(settlement.to_member) ?? 0
      balanceMap.set(settlement.to_member, current + Number(settlement.amount))
    }
    if (userMemberIds.includes(settlement.to_member)) {
      // Someone paid user
      const current = balanceMap.get(settlement.from_member) ?? 0
      balanceMap.set(settlement.from_member, current - Number(settlement.amount))
    }
  })

  // Convert to array and filter out zero balances
  const personBalances: PersonBalance[] = []
  balanceMap.forEach((amount, memberId) => {
    if (Math.abs(amount) < 0.01) return
    const member = allMembers.find((m) => m.id === memberId)
    if (member) {
      personBalances.push({ member, amount })
    }
  })

  // Sort by absolute amount descending
  personBalances.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))

  const peopleWhoOweYou = personBalances.filter((p) => p.amount > 0)
  const peopleYouOwe = personBalances.filter((p) => p.amount < 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance Summary</CardTitle>
        <CardDescription>Who owes whom</CardDescription>
      </CardHeader>
      <CardContent>
        {personBalances.length === 0 ? (
          <Empty
            icon={<Wallet className="h-10 w-10" />}
            title="All settled up!"
            description="No outstanding balances"
          />
        ) : (
          <div className="space-y-4">
            {peopleWhoOweYou.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Owes you</p>
                <div className="space-y-2">
                  {peopleWhoOweYou.slice(0, 3).map(({ member, amount }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-success/5 border border-success/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-sm font-medium text-success">
                          {member.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-success">{formatCurrency(amount)}</span>
                        <ArrowRight className="h-3 w-3 text-success" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {peopleYouOwe.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">You owe</p>
                <div className="space-y-2">
                  {peopleYouOwe.slice(0, 3).map(({ member, amount }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-medium text-destructive">
                          {member.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3 text-destructive" />
                        <span className="font-semibold text-destructive">{formatCurrency(Math.abs(amount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
