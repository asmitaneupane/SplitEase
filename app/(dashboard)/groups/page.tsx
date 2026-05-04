import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { PageHeader } from '@/components/dashboard/page-header'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Home, History } from 'lucide-react'
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
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Groups"
        description="Public expense splitting with friends and roommates"
        actions={
          <Button asChild className="rounded-full shadow-lg shadow-primary/20">
          <Link href="/groups/new">
            <Plus className="h-4 w-4 mr-2" />
            New Group
          </Link>
          </Button>
        }
      />

      {!groups || groups.length === 0 ? (
        <Card className="glass border-transparent shadow-2xl p-12 text-center">
          <CardContent>
            <Empty
              icon={<Users className="h-16 w-16 text-primary/20" />}
              title="Alone in the world?"
              description="Start splitting expenses with friends, roommates, or travel buddies."
              action={
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="rounded-full px-6 font-bold shadow-xl shadow-primary/20">
                    <Link href="/groups/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full px-6 font-bold glass">
                    <Link href="/household">
                      <Home className="h-4 w-4 mr-2" />
                      Monthly Logs
                    </Link>
                  </Button>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block group">
              <Card className="h-full glass hover:bg-card transition-all duration-300 border-transparent shadow-xl group-hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2 font-medium">
                    {group.description || 'Split everything easily.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/80 rounded-full border border-border/50">
                       <Users className="h-3 w-3 text-muted-foreground" />
                       <span className="text-[10px] font-black uppercase tracking-wider">{countMap.get(group.id) ?? 0} Members</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{group.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/30">
                     <History className="h-3 w-3 text-muted-foreground" />
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                       Last activity {formatDistanceToNow(new Date(group.updated_at), { addSuffix: true })}
                     </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
