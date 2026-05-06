import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Users,
  Settings,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  LayoutGrid,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { GroupMembers } from "@/components/groups/group-members";
import { GroupExpenses } from "@/components/groups/group-expenses";
import { GroupBalances } from "@/components/groups/group-balances";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get group - Robust lookup (supports ID or Slug)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let group;

  if (isUUID) {
    const { data } = await supabase.from("groups").select("*").eq("id", id).single();
    group = data;
  }

  if (!group) {
    const { data } = await supabase.from("groups").select("*").eq("slug", id).single();
    group = data;
  }

  if (!group) {
    notFound();
  }

  // Get members
  const { data: members } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", group.id)
    .order("joined_at", { ascending: true });

  const currentMember = members?.find((m) => m.user_id === user.id);
  const isAdmin = currentMember?.role === "admin";

  // Get expenses with splits
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, expense_splits(*)")
    .eq("group_id", group.id)
    .order("date", { ascending: false });

  // Get settlements
  const { data: settlements } = await supabase
    .from("settlements")
    .select("*")
    .eq("group_id", group.id)
    .order("settled_at", { ascending: false });

  const totalExpenses =
    expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  const totalSettled =
    settlements?.reduce((sum, s) => sum + Number(s.amount), 0) ?? 0;

  const userMemberIds =
    members?.filter((m) => m.user_id === user.id).map((m) => m.id) ?? [];
  let userOwed = 0;
  let userOwes = 0;

  expenses?.forEach((expense) => {
    const isPayer = userMemberIds.includes(expense.paid_by);
    expense.expense_splits?.forEach(
      (split: { member_id: string; amount: number; is_settled: boolean }) => {
        if (split.is_settled) return;
        if (isPayer && !userMemberIds.includes(split.member_id)) {
          userOwed += Number(split.amount);
        } else if (!isPayer && userMemberIds.includes(split.member_id)) {
          userOwes += Number(split.amount);
        }
      },
    );
  });

  settlements?.forEach((settlement) => {
    if (userMemberIds.includes(settlement.from_member)) {
      userOwes -= Number(settlement.amount);
    }
    if (userMemberIds.includes(settlement.to_member)) {
      userOwed -= Number(settlement.amount);
    }
  });

  const userBalance = userOwed - userOwes;

  return (
    <div className="space-y-10 pb-20 animate-in-slide">
      {/* Minimal Header */}
      <div className="relative p-10 rounded-[2rem] bg-white border border-black/5 shadow-sm overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-12 h-12">
              <Link href="/groups">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight">{group.name}</h1>
                <Badge variant="outline" className="rounded-full border-black/10 text-muted-foreground/40 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                  {group.currency}
                </Badge>
              </div>
              {group.description && (
                <p className="text-muted-foreground/60 text-sm font-medium">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isAdmin && (
                <Button variant="ghost" size="icon" asChild className="rounded-xl border border-black/5 w-11 h-11">
                  <Link href={`/groups/${group.slug || group.id}/settings`}>
                    <Settings className="h-5 w-5 text-muted-foreground/50" />
                  </Link>
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Financial Health Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard title="Total Spending" amount={totalExpenses} currency={group.currency} color="text-primary" />
        <StatCard title="Total Settled" amount={totalSettled} currency={group.currency} color="text-emerald-400" />
        <StatCard title="Your Net Balance" amount={userBalance} currency={group.currency} color={userBalance >= 0 ? "text-emerald-400" : "text-rose-400"} isNet />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-8">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 h-12 rounded-xl flex items-center justify-start gap-1 max-w-fit px-1">
          <TabsTrigger value="expenses" className="rounded-lg px-6 h-full data-[state=active]:bg-white/[0.05] data-[state=active]:text-primary text-[10px] font-black uppercase tracking-widest gap-2 transition-all">
            <Receipt className="h-3.5 w-3.5" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="rounded-lg px-6 h-full data-[state=active]:bg-white/[0.05] data-[state=active]:text-primary text-[10px] font-black uppercase tracking-widest gap-2 transition-all">
            <TrendingUp className="h-3.5 w-3.5" />
            Balances
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg px-6 h-full data-[state=active]:bg-white/[0.05] data-[state=active]:text-primary text-[10px] font-black uppercase tracking-widest gap-2 transition-all">
            <Users className="h-3.5 w-3.5" />
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="animate-in-fade outline-none">
          <GroupExpenses
            groupId={group.id}
            members={members ?? []}
            expenses={expenses ?? []}
            currency={group.currency}
          />
        </TabsContent>

        <TabsContent value="balances" className="animate-in-fade outline-none">
          <GroupBalances
            groupId={group.id}
            members={members ?? []}
            expenses={expenses ?? []}
            settlements={settlements ?? []}
            currency={group.currency}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="members" className="animate-in-fade outline-none">
          <GroupMembers
            groupId={group.id}
            groupName={group.name}
            members={members ?? []}
            isAdmin={isAdmin}
            currentUserId={user.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, amount, currency, color, isNet }: any) {
  return (
    <Card className="glass border-white/5 shadow-sm relative overflow-hidden group">
      <CardHeader className="pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-black tracking-tighter ${color}`}>
          {isNet && amount >= 0 ? "+" : ""}
          {formatCurrency(amount, currency)}
        </div>
      </CardContent>
    </Card>
  )
}
