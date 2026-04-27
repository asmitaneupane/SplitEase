'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import type { Activity, Group } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { History, Receipt, Users, CreditCard, UserPlus } from 'lucide-react'

interface RecentActivityProps {
  activities: Activity[]
  groups: Group[]
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  expense: Receipt,
  group: Users,
  settlement: CreditCard,
  member: UserPlus,
}

const activityColors: Record<string, string> = {
  create: 'bg-success/10 text-success',
  update: 'bg-primary/10 text-primary',
  delete: 'bg-destructive/10 text-destructive',
  settle: 'bg-accent/10 text-accent-foreground',
}

export function RecentActivity({ activities, groups }: RecentActivityProps) {
  const getGroupName = (groupId: string | null) => {
    if (!groupId) return 'Unknown'
    const group = groups.find((g) => g.id === groupId)
    return group?.name ?? 'Unknown'
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
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest changes across your groups</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <Empty
            icon={<History className="h-10 w-10" />}
            title="No activity yet"
            description="Activity will appear here as you add expenses and make changes"
          />
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.entity_type] ?? Receipt
              const colorClass = activityColors[activity.action] ?? 'bg-secondary text-secondary-foreground'
              
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getActivityMessage(activity)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getGroupName(activity.group_id)}</span>
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
