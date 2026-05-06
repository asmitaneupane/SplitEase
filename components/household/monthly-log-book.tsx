"use client";

import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { CalendarDays, Plus, TrendingUp, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

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
  description: string | null;
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

import NepaliDate from "nepali-date-converter";

function formatDay(dateString: string, mode: CalendarMode) {
  const date = new Date(`${dateString}T00:00:00`);
  if (mode === "nepali") {
    return new NepaliDate(date).format("YYYY MMMM DD");
  }
  return format(date, "MMM dd, yyyy");
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
    const monthMap = new Map<string, { english: string; nepali: string }>();
    
    [...incomes, ...expenses].forEach((log) => {
      if (!log.date) return;
      const date = new Date(`${log.date}T00:00:00`);
      
      if (calendarMode === "english") {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) {
          monthMap.set(key, {
            english: format(date, "MMMM yyyy"),
            nepali: new NepaliDate(date).format("MMMM YYYY")
          });
        }
      } else {
        const bs = new NepaliDate(date);
        const key = `${bs.getYear()}-${String(bs.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) {
          monthMap.set(key, {
            english: format(date, "MMMM yyyy"),
            nepali: bs.format("MMMM YYYY")
          });
        }
      }
    });

    return Array.from(monthMap.entries())
      .map(([value, labels]) => ({
        value,
        ...labels
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [incomes, expenses, calendarMode]);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Reset selected month when switching modes to avoid invalid filters
  useEffect(() => {
    setSelectedMonth("all");
  }, [calendarMode]);

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
    
    const monthFiltered = selectedMonth === "all"
        ? allRows
        : allRows.filter((row) => {
            const date = new Date(`${row.date}T00:00:00`);
            if (calendarMode === "english") {
              return row.date.startsWith(selectedMonth);
            } else {
              const bs = new NepaliDate(date);
              const key = `${bs.getYear()}-${String(bs.getMonth() + 1).padStart(2, "0")}`;
              return key === selectedMonth;
            }
          });

    return monthFiltered.sort(
      (a, b) =>
        new Date(`${b.date}T00:00:00`).getTime() -
        new Date(`${a.date}T00:00:00`).getTime(),
    );
  }, [incomes, expenses, memberNameMap, selectedMonth, calendarMode]);

  return (
    <div className="space-y-6">
      {/* Premium Filter Bar */}
      <div className="flex flex-col gap-4 rounded-[2rem] bg-white border border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-4 ml-2">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Universe Mode</span>
            <span className="text-sm font-black text-slate-900 tracking-tight">Timeline View</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row items-center mr-2">
          <Tabs
            value={calendarMode}
            onValueChange={(value) => setCalendarMode(value as CalendarMode)}
            className="w-full sm:w-auto"
          >
            <TabsList className="bg-slate-50/50 border border-black/5 p-1 rounded-full h-12">
              <TabsTrigger 
                value="english" 
                className="rounded-full text-[10px] font-black uppercase tracking-widest px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
              >
                English
              </TabsTrigger>
              <TabsTrigger 
                value="nepali" 
                className="rounded-full text-[10px] font-black uppercase tracking-widest px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all"
              >
                Nepali
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px] bg-slate-50/50 border border-black/5 rounded-full font-black text-[11px] h-12 px-6 focus:ring-0 focus:ring-offset-0 transition-all hover:bg-slate-100/50 uppercase tracking-tight">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl p-1">
              <SelectItem value="all" className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-primary/5 focus:text-primary">All History</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value} className="font-black text-[10px] uppercase tracking-widest rounded-xl focus:bg-primary/5 focus:text-primary">
                  {calendarMode === "nepali"
                    ? `${month.nepali} (${month.english})`
                    : `${month.english} (${month.nepali})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unified actions are now in the page header */}

      {filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-black/5 hover:border-primary/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
                  log.type === "income" ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                )}>
                  {log.type === "income" ? <TrendingUp className="h-6 w-6" /> : <DollarSign className="h-6 w-6" />}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 tracking-tight">{log.title}</p>
                    <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 border-none">
                      {log.badge}
                    </Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {log.memberName} • {formatDay(log.date, calendarMode)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-black tracking-tighter",
                  log.type === "income" ? "text-emerald-500" : "text-rose-500"
                )}>
                  {log.type === "income" ? "+" : "-"}
                  {formatCurrency(log.amount, currency)}
                </p>
              </div>
            </div>
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
