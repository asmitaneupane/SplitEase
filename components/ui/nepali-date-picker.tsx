'use client'

import * as React from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import NepaliDate from 'nepali-date-converter'
import { format, parseISO } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DualDatePickerProps {
  date: string // YYYY-MM-DD (English)
  onChange: (date: string) => void
  className?: string
}

const NE_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
]

export function DualDatePicker({ date, onChange, className }: DualDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'BS' | 'AD'>('BS')
  
  // Current date objects
  const adDate = React.useMemo(() => (date ? parseISO(date) : new Date()), [date])
  const bsDate = React.useMemo(() => new NepaliDate(adDate), [adDate])

  // Local state for the picker (BS values)
  const [bsYear, setBsYear] = React.useState(bsDate.getYear())
  const [bsMonth, setBsMonth] = React.useState(bsDate.getMonth())

  // Local state for English picker
  const [adYear, setAdYear] = React.useState(adDate.getFullYear())
  const [adMonth, setAdMonth] = React.useState(adDate.getMonth())

  // Update local states when prop date changes
  React.useEffect(() => {
    if (mode === 'BS') {
      setBsYear(bsDate.getYear())
      setBsMonth(bsDate.getMonth())
    } else {
      setAdYear(adDate.getFullYear())
      setAdMonth(adDate.getMonth())
    }
  }, [adDate, bsDate, mode])

  // Get days in current BS month
  const bsDaysInMonth = React.useMemo(() => {
    const getDays = (y: number, m: number) => {
        let testDay = 32;
        while(testDay > 27) {
            try {
                const testDate = new NepaliDate(y, m, testDay);
                if (testDate.getMonth() === m && testDate.getDate() === testDay) return testDay;
            } catch(e) {}
            testDay--;
        }
        return 28;
    }
    return getDays(bsYear, bsMonth)
  }, [bsYear, bsMonth])

  // Get days in current AD month
  const adDaysInMonth = React.useMemo(() => {
    return new Date(adYear, adMonth + 1, 0).getDate()
  }, [adYear, adMonth])

  const handleBsDateSelect = (day: number) => {
    const newBsDate = new NepaliDate(bsYear, bsMonth, day)
    onChange(newBsDate.toJsDate().toISOString().split('T')[0])
    setOpen(false)
  }

  const handleAdDateSelect = (day: number) => {
    const newAdDate = new Date(adYear, adMonth, day)
    onChange(newAdDate.toISOString().split('T')[0])
    setOpen(false)
  }

  const bsYears = React.useMemo(() => {
    const current = new NepaliDate().getYear()
    const arr = []
    for (let i = current - 50; i <= current + 10; i++) arr.push(i)
    return arr
  }, [])

  const adYears = React.useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let i = current - 50; i <= current + 10; i++) arr.push(i)
    return arr
  }, [])

  return (
    <div className={cn("relative group", className)}>
      <div className="flex items-center justify-between h-16 w-full rounded-[1.5rem] bg-white border border-black/5 p-1 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-primary/20">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex-1 flex items-center gap-4 px-4 text-left outline-none"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-tight">
                {mode === 'BS' ? (
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    {bsDate.format('YYYY MMMM DD')}
                  </span>
                ) : (
                  <span className="text-sm font-black text-slate-900 tracking-tight">
                    {format(adDate, "PPP")}
                  </span>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 bg-white/95 backdrop-blur-xl border border-black/5 shadow-2xl rounded-[1.5rem]" align="start">
            <div className="space-y-4">
              {mode === 'BS' ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Select value={bsYear.toString()} onValueChange={(v) => setBsYear(parseInt(v))}>
                      <SelectTrigger className="h-9 rounded-lg border-black/5 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {bsYears.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-black uppercase tracking-widest">{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={bsMonth.toString()} onValueChange={(v) => setBsMonth(parseInt(v))}>
                      <SelectTrigger className="h-9 rounded-lg border-black/5 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NE_MONTHS.map((m, i) => <SelectItem key={i} value={i.toString()} className="text-[10px] font-black uppercase tracking-widest">{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[10px] font-black text-slate-300 py-2">{d}</div>
                    ))}
                    {Array.from({ length: new NepaliDate(bsYear, bsMonth, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: bsDaysInMonth }).map((_, i) => {
                      const day = i + 1
                      const isSelected = bsDate.getYear() === bsYear && bsDate.getMonth() === bsMonth && bsDate.getDate() === day
                      return (
                        <Button
                          key={day}
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 p-0 text-[10px] font-black rounded-lg transition-all",
                            isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                              : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                          )}
                          onClick={() => handleBsDateSelect(day)}
                        >
                          {day}
                        </Button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <Select value={adYear.toString()} onValueChange={(v) => setAdYear(parseInt(v))}>
                      <SelectTrigger className="h-9 rounded-lg border-black/5 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {adYears.map(y => <SelectItem key={y} value={y.toString()} className="text-[10px] font-black uppercase tracking-widest">{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={adMonth.toString()} onValueChange={(v) => setAdMonth(parseInt(v))}>
                      <SelectTrigger className="h-9 rounded-lg border-black/5 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()} className="text-[10px] font-black uppercase tracking-widest">
                            {format(new Date(2000, i, 1), "MMMM")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} className="text-[10px] font-black text-slate-300 py-2">{d}</div>
                    ))}
                    {Array.from({ length: new Date(adYear, adMonth, 1).getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: adDaysInMonth }).map((_, i) => {
                      const day = i + 1
                      const isSelected = adDate.getFullYear() === adYear && adDate.getMonth() === adMonth && adDate.getDate() === day
                      return (
                        <Button
                          key={day}
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 p-0 text-[10px] font-black rounded-lg transition-all",
                            isSelected 
                              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" 
                              : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                          )}
                          onClick={() => handleAdDateSelect(day)}
                        >
                          {day}
                        </Button>
                      )
                    })}
                  </div>
                </>
              )}

              <div className="pt-2 border-t border-black/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center leading-relaxed">
                  {mode === 'BS' ? `English: ${format(new NepaliDate(bsYear, bsMonth, bsDate.getDate() > bsDaysInMonth ? bsDaysInMonth : bsDate.getDate()).toJsDate(), "PPP")}` : `Nepali: ${new NepaliDate(new Date(adYear, adMonth, adDate.getDate() > adDaysInMonth ? adDaysInMonth : adDate.getDate())).format('YYYY MMMM DD')}`}
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-full pr-4 flex items-center">
          <Select value={mode} onValueChange={(v) => setMode(v as 'BS' | 'AD')}>
            <SelectTrigger className="h-10 rounded-full border-none bg-slate-50 text-[10px] font-black uppercase tracking-widest text-primary w-[70px] shadow-sm hover:bg-slate-100 transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-black/5 shadow-2xl p-1">
              <SelectItem value="BS" className="text-[10px] font-black uppercase tracking-widest rounded-xl">BS</SelectItem>
              <SelectItem value="AD" className="text-[10px] font-black uppercase tracking-widest rounded-xl">AD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
