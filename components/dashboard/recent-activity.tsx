'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import type { Activity, Group } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { History, Receipt, Users, CreditCard, UserPlus, TrendingUp, TrendingDown, Home, Wallet, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
  activities: Activity[]
  groups: Group[]
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  expense: Receipt,
  group: Users,
  settlement: CreditCard,
  member: UserPlus,
  income: TrendingUp,
  household: Home,
}

const activityColors: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/20',
  update: 'bg-primary/10 text-primary border-primary/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  settle: 'bg-accent/10 text-accent-foreground border-accent/20',
}

export function RecentActivity({ activities, groups }: RecentActivityProps) {
  const getGroupName = (activity: Activity) => {
    if (activity.household_id) return 'Monthly Log'
    if (!activity.group_id) return 'Global'
    const group = groups.find((g) => g.id === activity.group_id)
    return group?.name ?? 'Group'
  }

  const getActivityMessage = (activity: Activity) => {
    const metadata = activity.metadata as Record<string, string>
    switch (activity.entity_type) {
      case 'expense':
        if (activity.action === 'create') {
          return `New expense: ${metadata.description || 'Expense'}`
        } else if (activity.action === 'delete') {
          return `Deleted expense: ${metadata.description || 'Expense'}`
        }
        return `Updated expense: ${metadata.description || 'Expense'}`
      case 'income':
        return `Log Income: ${metadata.source || 'Income'}`
      case 'household':
        if (activity.action === 'create') {
          return `Created log: ${metadata.name || 'Log'}`
        }
        return `Updated log: ${metadata.name || 'Log'}`
      case 'group':
        if (activity.action === 'create') {
          return `Created group: ${metadata.name || 'Group'}`
        }
        return `Updated group: ${metadata.name || 'Group'}`
      case 'settlement':
        return `Settled ${metadata.amount || ''}`
      case 'member':
        if (activity.action === 'create') {
          return `Added member: ${metadata.name || 'Member'}`
        } else if (activity.action === 'delete') {
          return `Removed member: ${metadata.name || 'Member'}`
        }
        return `Updated member: ${metadata.name || 'Member'}`
      default:
        return `${activity.action} ${activity.entity_type}`
    }
  }

  return (
    <Card className="bg-white border-black/5 shadow-sm h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
           <Sparkles className="h-4 w-4 text-primary" />
           Recent Activity
        </CardTitle>
        <CardDescription>Latest changes across your universe</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <Empty
            icon={<History className="h-10 w-10" />}
            title="Silence is golden"
            description="Your recent financial activity will appear here."
          />
        ) : (
          <div className="flex flex-col gap-6">
            {activities.map((activity, i) => {
              const Icon = activityIcons[activity.entity_type] ?? Receipt
              const colorClass = activityColors[activity.action] ?? 'bg-secondary text-secondary-foreground'
              
              return (
                <div key={activity.id} className="flex items-start gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                      colorClass
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {i !== activities.length - 1 && (
                       <div className="w-0.5 h-8 bg-border/30 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                       {getActivityMessage(activity)}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground mt-1 tracking-widest">
                      <span>{getGroupName(activity)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
