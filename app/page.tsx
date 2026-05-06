import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, Users, Wallet, ArrowRight, CheckCircle2, Split, History, Home, TrendingUp, Sparkles } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full -z-10" />

      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-primary/30 active:scale-95">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight">SplitEase</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative pt-24 pb-20 px-4">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="h-4 w-4" />
              Ultimate Shared Finance Management
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-foreground mb-8 text-balance leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
              Split expenses, <br />
              <span className="text-gradient">not relationships.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              The smartest way to track group spending and intimate shared finances. 
              Whether it's roommates, trips, or family budgets - we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Button size="lg" asChild className="rounded-full h-14 px-8 text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all group">
                <Link href="/auth/sign-up">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="rounded-full h-14 px-8 text-lg font-semibold bg-card/50 hover:bg-card transition-colors">
                <Link href="#features">See How it Works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Feature Highlights (New Section) */}
        <section className="py-24 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Two modes for <br />
                <span className="text-primary">all your needs</span>
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl glass hover:bg-card/80 transition-all group">
                  <div className="flex gap-4">
                    <div className="p-2 h-fit bg-secondary rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Split className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Group Expenses</h3>
                      <p className="text-muted-foreground text-sm">Perfect for roommates, travel buddies, and dinner groups. Bill splitting made effortless.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl glass hover:bg-card/80 transition-all group">
                  <div className="flex gap-4">
                    <div className="p-2 h-fit bg-secondary rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Monthly Logs (Household)</h3>
                      <p className="text-muted-foreground text-sm">Dedicated space for partners and family. Track joint income, shared budgets, and long-term goals.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square glass-darker rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-1000">
               {/* Mockup UI representation */}
               <div className="w-full h-full rounded-2xl bg-background/50 border border-white/10 flex flex-col p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-2 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-32 bg-primary/20 rounded" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 glass-darker rounded-xl flex flex-col justify-center p-4">
                      <div className="h-2 w-12 bg-muted rounded mb-2" />
                      <div className="h-6 w-20 bg-success/20 rounded" />
                    </div>
                    <div className="h-24 glass-darker rounded-xl flex flex-col justify-center p-4">
                      <div className="h-2 w-12 bg-muted rounded mb-2" />
                      <div className="h-6 w-20 bg-destructive/20 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 glass rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-muted/50" />
                          <div className="h-2 w-20 bg-muted rounded" />
                        </div>
                        <div className="h-2 w-12 bg-muted rounded" />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 bg-secondary/30 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Powerful yet simple</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Everything you need to stay on top of your shared finances.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Receipt className="h-6 w-6" />}
                title="Swift Tracking"
                description="Log expenses in seconds. Categorize and attach notes to keep everything organized."
              />
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title="Smart Balances"
                description="Automatic calculation of who owes what. Simplify settlements with a single click."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Multi-User Sync"
                description="Invite members to your groups. Real-time updates keep everyone on the same page."
              />
              <FeatureCard
                icon={<Wallet className="h-6 w-6" />}
                title="Net Worth Tracking"
                description="See your combined group balances and household wealth in one unified view."
              />
              <FeatureCard
                icon={<History className="h-6 w-6" />}
                title="Rich Activity Feed"
                description="A timeline of every change. Never wonder why a balance changed again."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="Instant Settlements"
                description="Settle debts easily and maintain a clean sheet with your friends and family."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="max-w-4xl mx-auto text-center glass-darker p-12 rounded-[3rem] shadow-2xl border-primary/10">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to simplify <br />
              <span className="text-gradient">your life?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of users who trust SplitEase for their shared expense management.
            </p>
            <Button size="lg" asChild className="rounded-full h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all hover:scale-105">
              <Link href="/auth/sign-up">
                Get Started Now - It's Free
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight">SplitEase</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
             <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
             <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
             <Link href="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SplitEase. Built for transparency.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-3xl glass hover:bg-card transition-all duration-300 group border-transparent hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}
