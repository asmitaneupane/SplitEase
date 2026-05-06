'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Receipt, ArrowRight, User, Mail, Lock, AlertCircle } from 'lucide-react'
import { claimPendingMemberships } from '@/lib/membership'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        setError('User already exists or email has already been used.');
      } else {
        setError(error.message);
      }
      setLoading(false)
    } else {
      if (data.user) {
        await claimPendingMemberships(supabase, data.user)
      }
      
      // With email confirmation disabled in Supabase, we get a session immediately
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />

      <div className="w-full max-w-md px-4 relative z-10 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="p-3 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl group-hover:rotate-12 transition-all duration-500 shadow-2xl shadow-primary/40">
              <Receipt className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="text-3xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors">
              SplitEase
            </span>
          </Link>
          <p className="text-muted-foreground mt-4 font-medium italic">
            "Join the circle of financial clarity"
          </p>
        </div>

        <Card className="glass-darker border-transparent shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-black tracking-tight">Create Identity</CardTitle>
            <CardDescription className="font-medium">Start tracking and splitting in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6 pt-4">
              <div className="space-y-2">
                <FieldLabel htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</FieldLabel>
                <div className="relative group">
                   <Input
                     id="fullName"
                     type="text"
                     placeholder="John Doe"
                     className="bg-background/50 border-border/50 focus:border-primary/50 h-12 rounded-xl transition-all pl-10"
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required
                   />
                   <div className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <User className="h-5 w-5" />
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</FieldLabel>
                <div className="relative group">
                   <Input
                     id="email"
                     type="email"
                     placeholder="you@awesome.com"
                     className="bg-background/50 border-border/50 focus:border-primary/50 h-12 rounded-xl transition-all pl-10"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required
                   />
                   <div className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Mail className="h-5 w-5" />
                   </div>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Password</FieldLabel>
                <div className="relative group">
                   <Input
                     id="password"
                     type="password"
                     placeholder="••••••••"
                     className="bg-background/50 border-border/50 focus:border-primary/50 h-12 rounded-xl transition-all pl-10"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     minLength={6}
                     required
                   />
                   <div className="absolute left-3 top-3.5 text-muted-foreground group-focus-within:text-primary transition-colors">
                      <Lock className="h-5 w-5" />
                   </div>
                </div>
                <p className="text-[9px] text-muted-foreground ml-1 uppercase font-bold tracking-tighter">Min. 6 characters for safety</p>
              </div>

              {error && (
                <div className="p-4 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" disabled={loading}>
                {loading ? (
                  <Spinner className="h-5 w-5" />
                ) : (
                  <>
                    Initialize Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/30 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline ml-1">
                  Authorize In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
