import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { PageHeader } from '@/components/dashboard/page-header'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Home, History } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { GroupCardActions } from '@/components/groups/group-card-actions'
import { formatCurrency } from '@/lib/currency'

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

  // Get all members for these groups
  const { data: allMembers } = await supabase
    .from('group_members')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  // Get expenses from user's groups
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, expense_splits(*)')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  // Get settlements
  const { data: settlements } = await supabase
    .from('settlements')
    .select('*')
    .in('group_id', groupIds.length > 0 ? groupIds : [''])

  const userMemberIds = allMembers?.filter((m) => m.user_id === user.id).map((m) => m.id) ?? []

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/5 pb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            Shared Spaces
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            Groups
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-md">
            Manage your collaborative expense tracking and shared financial circles with precision.
          </p>
        </div>
        <Button size="elegant" asChild className="shadow-lg shadow-primary/10">
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Link>
        </Button>
      </div>

      {!groups || groups.length === 0 ? (
        <div className="py-24 bg-white rounded-[2.5rem] border border-black/5 shadow-sm text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-black/5 shadow-inner">
            <Users className="h-10 w-10 text-slate-300" />
          </div>
          <div className="max-w-xs mx-auto space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Start a Circle</h3>
            <p className="text-slate-400 text-sm font-medium">
              Create your first group to start splitting bills and tracking shared costs.
            </p>
          </div>
          <Button asChild size="elegant" className="px-10">
            <Link href="/groups/new">Create Group</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {groups.map((group) => {
            const groupMembers = allMembers?.filter(m => m.group_id === group.id) || []
            const groupExpenses = expenses?.filter(e => e.group_id === group.id) || []
            const groupSettlements = settlements?.filter(s => s.group_id === group.id) || []
            
            const totalSpent = groupExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
            
            let totalOwed = 0
            let totalOwing = 0
            
            groupExpenses.forEach((expense) => {
              const isPayer = userMemberIds.includes(expense.paid_by)
              expense.expense_splits?.forEach((split: { member_id: string; amount: number; is_settled: boolean }) => {
                if (split.is_settled) return
                if (isPayer && !userMemberIds.includes(split.member_id)) {
                  totalOwed += Number(split.amount)
                } else if (!isPayer && userMemberIds.includes(split.member_id)) {
                  totalOwing += Number(split.amount)
                }
              })
            })
            
            groupSettlements.forEach((settlement) => {
              if (userMemberIds.includes(settlement.from_member)) {
                totalOwing -= Number(settlement.amount)
              }
              if (userMemberIds.includes(settlement.to_member)) {
                totalOwed -= Number(settlement.amount)
              }
            })
            
            const netBalance = totalOwed - totalOwing

            return (
              <Card key={group.id} className="bg-white border-black/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 rounded-[1.5rem] overflow-hidden group">
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm shrink-0">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors truncate">
                          {group.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium text-slate-400 line-clamp-1 leading-relaxed">
                          {group.description || "No description provided."}
                        </CardDescription>
                      </div>
                    </div>
                    <GroupCardActions 
                      groupId={group.id} 
                      groupSlug={group.slug} 
                      groupName={group.name} 
                      groupDescription={group.description}
                      groupCurrency={group.currency}
                      isOwner={group.created_by === user.id}
                    />
                  </div>
                </CardHeader>
                <Link href={`/groups/${group.slug || group.id}`} className="block">
                  <CardContent className="p-6 pt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 border border-black/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Spent</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter">
                          {formatCurrency(totalSpent, group.currency)}
                        </p>
                      </div>
                      <div className="p-3.5 bg-slate-50 border border-black/5 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Balance</p>
                        <p className={`text-xl font-black tracking-tighter ${netBalance >= 0 ? (netBalance === 0 ? 'text-slate-900' : 'text-emerald-500') : 'text-rose-500'}`}>
                          {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance, group.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-black/5">
                       <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {groupMembers.slice(0, 3).map((member) => (
                              <div key={member.id} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-primary uppercase shadow-sm">
                                 {member.name[0]}
                              </div>
                            ))}
                          </div>
                          {groupMembers.length > 3 && (
                            <span className="text-[10px] font-black text-slate-300 ml-1">+{groupMembers.length - 3} others</span>
                          )}
                       </div>
                       <div className="w-10 h-10 rounded-full bg-slate-50 border border-black/5 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
