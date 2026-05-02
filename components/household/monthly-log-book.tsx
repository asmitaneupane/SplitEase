"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface Member {
  id: string;
  name: string;
}

interface IncomeLog {
  id: string;
  member_id: string;
  amount: number | string;
  description: string | null;
  source: string | null;
  date: string;
}

interface ExpenseLog {
  id: string;
  member_id: string;
  amount: number | string;
  description: string;
  category: string | null;
  date: string;
}

interface MonthlyLogBookProps {
  householdId: string;
  currency: string;
  members: Member[];
  incomes: IncomeLog[];
  expenses: ExpenseLog[];
}

type CalendarMode = "english" | "nepali";

function formatMonth(date: Date, mode: CalendarMode) {
  const locale = mode === "nepali" ? "ne-NP-u-ca-bikram-sambat" : "en-US";
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

function formatDay(dateString: string, mode: CalendarMode) {
  const date = new Date(`${dateString}T00:00:00`);
  const locale = mode === "nepali" ? "ne-NP-u-ca-bikram-sambat" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function MonthlyLogBook({
  householdId,
  currency,
  members,
  incomes,
  expenses,
}: MonthlyLogBookProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("english");

  const monthOptions = useMemo(() => {
    const monthMap = new Map<string, Date>();
    [...incomes, ...expenses].forEach((log) => {
      if (!log.date) return;
      const date = new Date(`${log.date}T00:00:00`);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap.has(key)) monthMap.set(key, date);
    });

    return Array.from(monthMap.entries())
      .map(([value, date]) => ({
        value,
        englishLabel: formatMonth(date, "english"),
        nepaliLabel: formatMonth(date, "nepali"),
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [incomes, expenses]);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value ?? "all");

  const memberNameMap = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member) => map.set(member.id, member.name));
    return map;
  }, [members]);

  const filteredLogs = useMemo(() => {
    const incomeRows = incomes.map((log) => ({
      id: `income-${log.id}`,
      type: "income" as const,
      date: log.date,
      amount: Number(log.amount),
      title: log.description || log.source || "Income",
      badge: log.source || "Income",
      memberName: memberNameMap.get(log.member_id) || "Unknown member",
    }));

    const expenseRows = expenses.map((log) => ({
      id: `expense-${log.id}`,
      type: "expense" as const,
      date: log.date,
      amount: Number(log.amount),
      title: log.description || "Expense",
      badge: log.category || "Expense",
      memberName: memberNameMap.get(log.member_id) || "Unknown member",
    }));

    const allRows = [...incomeRows, ...expenseRows];
    const monthFiltered =
      selectedMonth === "all"
        ? allRows
        : allRows.filter((row) => row.date.startsWith(selectedMonth));

    return monthFiltered.sort(
      (a, b) =>
        new Date(`${b.date}T00:00:00`).getTime() -
        new Date(`${a.date}T00:00:00`).getTime(),
    );
  }, [incomes, expenses, memberNameMap, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Monthly Log Book</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Tabs
            value={calendarMode}
            onValueChange={(value) => setCalendarMode(value as CalendarMode)}
          >
            <TabsList>
              <TabsTrigger value="english">English Date</TabsTrigger>
              <TabsTrigger value="nepali">Nepali Date</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="min-w-[210px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.length > 0 ? (
                monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {calendarMode === "nepali"
                      ? `${month.nepaliLabel} (${month.englishLabel})`
                      : `${month.englishLabel} (${month.nepaliLabel})`}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="all">No month data</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/household/${householdId}/income/new`}>
            <Plus className="mr-1 h-4 w-4" />
            Add Income
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/household/${householdId}/expense/new`}>
            <Plus className="mr-1 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </div>

      {filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{log.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {log.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.memberName} • {formatDay(log.date, calendarMode)}
                    </p>
                  </div>
                  <p
                    className={`font-bold ${log.type === "income" ? "text-success" : "text-destructive"}`}
                  >
                    {log.type === "income" ? "+" : "-"}
                    {formatCurrency(log.amount, currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No logs found for this month. Add income or expense to start your shared monthly log book.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
