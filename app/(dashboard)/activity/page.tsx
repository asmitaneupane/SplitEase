import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/dashboard/page-header'
import { formatDistanceToNow } from 'date-fns'
import { History, Receipt, Users, CreditCard, UserPlus, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's groups
  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberGroups?.map((m) => m.group_id) ?? []

  // Get all activities from user's groups
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])
    .order('created_at', { ascending: false })
    .limit(50)

  // Get groups for names
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds.length > 0 ? groupIds : [''])

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return 'Unknown'
    const group = groups?.find((g) => g.id === groupId)
    return group?.name ?? 'Unknown'
  }

  const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    expense: Receipt,
    group: Users,
    settlement: CreditCard,
    member: UserPlus,
  }

  const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    create: Receipt,
    update: Edit,
    delete: Trash2,
    settle: CreditCard,
  }

  const actionColors: Record<string, string> = {
    create: 'bg-success/10 text-success',
    update: 'bg-primary/10 text-primary',
    delete: 'bg-destructive/10 text-destructive',
    settle: 'bg-accent text-accent-foreground',
  }

  const getActivityMessage = (activity: { action: string; entity_type: string; metadata: Record<string, unknown> }) => {
    const metadata = activity.metadata as Record<string, string>
    switch (activity.entity_type) {
      case 'expense':
        if (activity.action === 'create') {
          return { action: 'Added expense', detail: metadata.description || 'Expense' }
        } else if (activity.action === 'delete') {
          return { action: 'Deleted expense', detail: metadata.description || 'Expense' }
        }
        return { action: 'Updated expense', detail: metadata.description || 'Expense' }
      case 'group':
        if (activity.action === 'create') {
          return { action: 'Created group', detail: metadata.name || 'Group' }
        }
        return { action: 'Updated group', detail: metadata.name || 'Group' }
      case 'settlement':
        return { 
          action: 'Recorded settlement', 
          detail: `${metadata.from} paid ${metadata.to} ${metadata.amount}` 
        }
      case 'member':
        if (activity.action === 'create') {
          return { action: 'Added member', detail: metadata.name || 'Member' }
        } else if (activity.action === 'delete') {
          return { action: 'Removed member', detail: metadata.name || 'Member' }
        }
        return { action: 'Updated member', detail: metadata.name || 'Member' }
      default:
        return { action: activity.action, detail: activity.entity_type }
    }
  }

  // Group activities by date
  const groupedActivities = activities?.reduce((acc, activity) => {
    const date = new Date(activity.created_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(activity)
    return acc
  }, {} as Record<string, NonNullable<typeof activities>>) ?? {}

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Recent changes across all your groups"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>All activity from the last 50 events</CardDescription>
        </CardHeader>
        <CardContent>
          {!activities || activities.length === 0 ? (
            <Empty
              icon={<History className="h-10 w-10" />}
              title="No activity yet"
              description="Activity will appear here as you create groups, add expenses, and make changes"
              action={
                <Button asChild size="sm">
                  <Link href="/groups/new">Create Group</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground px-2">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="space-y-4">
                    {(dayActivities as any[])?.map((activity: any) => {
                      const Icon = activityIcons[activity.entity_type] ?? Receipt
                      const colorClass = actionColors[activity.action] ?? 'bg-secondary text-secondary-foreground'
                      const { action, detail } = getActivityMessage(activity)
                      const group = groups?.find((g) => g.id === activity.group_id)
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{action}</p>
                            <p className="text-sm text-muted-foreground truncate">{detail}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {group && (
                                <Link 
                                  href={`/groups/${group.id}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  {group.name}
                                </Link>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
