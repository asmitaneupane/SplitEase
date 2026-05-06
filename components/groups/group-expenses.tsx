'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Receipt, Utensils, Car, ShoppingBag, Film, Zap, Home, Plane, Heart, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { format } from 'date-fns'
import type { Expense, ExpenseSplit, GroupMember } from '@/lib/types'

interface GroupExpensesProps {
  groupId: string
  expenses: (Expense & { expense_splits: ExpenseSplit[] })[]
  members: GroupMember[]
  currency: string
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  general: Receipt,
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  entertainment: Film,
  utilities: Zap,
  rent: Home,
  travel: Plane,
  health: Heart,
  other: MoreHorizontal,
}

export function GroupExpenses({ groupId, expenses, members, currency }: GroupExpensesProps) {
  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    return member?.name ?? 'Unknown'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expenses ({expenses.length})
          </CardTitle>
          <CardDescription>All expenses in this group</CardDescription>
        </div>
        <Button asChild size="sm" className="rounded-full px-6 font-bold shadow-lg shadow-primary/20">
          <Link href={`/groups/${groupId}/expenses/new`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Expense
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <Empty
            icon={<Receipt className="h-10 w-10" />}
            title="No expenses yet"
            description="Add your first expense to start tracking"
          />
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const Icon = categoryIcons[expense.category] ?? Receipt
              const paidByName = getMemberName(expense.paid_by)
              const splitCount = expense.expense_splits?.length ?? 0
              
              return (
                <Link
                  key={expense.id}
                  href={`/groups/${groupId}/expenses/${expense.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{expense.description}</span>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {expense.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Paid by {paidByName}</span>
                      <span>•</span>
                      <span>Split {splitCount} ways</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(expense.amount, currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
