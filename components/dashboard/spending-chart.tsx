'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { format, parseISO, startOfDay } from 'date-fns'

interface SpendingChartProps {
  data: {
    date: string
    amount: number
    type: 'income' | 'expense'
    source: 'group' | 'household'
  }[]
}

export function SpendingChart({ data }: SpendingChartProps) {
  // Process data for the chart
  // Group by day and sum amounts
  const dailyData: Record<string, { date: string; income: number; expense: number }> = {}

  data.forEach((item) => {
    const day = format(parseISO(item.date), 'MMM dd')
    if (!dailyData[day]) {
      dailyData[day] = { date: day, income: 0, expense: 0 }
    }
    if (item.type === 'income') {
      dailyData[day].income += item.amount
    } else {
      dailyData[day].expense += item.amount
    }
  })

  const chartData = Object.values(dailyData)

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground italic">
        No spending data yet to display
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(value) => `NPR ${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--success)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorIncome)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="var(--destructive)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorExpense)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
