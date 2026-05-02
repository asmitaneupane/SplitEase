import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { PageHeader } from '@/components/dashboard/page-header'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Home } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's groups with member count
  const { data: memberGroups } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = memberGroups?.map((m) => m.group_id) ?? []

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds.length > 0 ? groupIds : [''])
    .order('updated_at', { ascending: false })

  // Get member counts for each group
  const { data: memberCounts } = await supabase
    .from('group_members')
    .select('group_id')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  const countMap = new Map<string, number>()
  memberCounts?.forEach((m) => {
    countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1)
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        description="Manage your expense groups"
        actions={
          <Button asChild>
          <Link href="/groups/new">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Link>
          </Button>
        }
      />

      {!groups || groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty
              icon={<Users className="h-12 w-12" />}
              title="No groups yet"
              description="Create a group to start tracking shared expenses with friends, roommates, or travel buddies. For family-level finances, use Household."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild>
                    <Link href="/groups/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Group
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/household">
                      <Home className="h-4 w-4 mr-2" />
                      Open Household
                    </Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <Card className="h-full hover:border-primary/30 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {group.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{countMap.get(group.id) ?? 0} members</span>
                    <span>{group.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated {formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
