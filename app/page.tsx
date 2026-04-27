import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, Users, Wallet, ArrowRight, CheckCircle2, Split, History } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Receipt className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SplitEase</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-6">
              <CheckCircle2 className="h-4 w-4" />
              100% Free - No Hidden Costs
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance leading-tight">
              Split expenses,{' '}
              <span className="text-primary">not friendships</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              Track expenses, split bills, and manage debts with friends and roommates. 
              No more awkward money conversations - let SplitEase handle it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Start for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-4 bg-card/50 border-y border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Simple, powerful features to manage shared expenses without the hassle.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Receipt className="h-6 w-6" />}
                title="Track Expenses"
                description="Add expenses quickly and categorize them. Keep a clear record of who paid for what."
              />
              <FeatureCard
                icon={<Split className="h-6 w-6" />}
                title="Split Any Way"
                description="Split equally, by percentage, or exact amounts. Works for any splitting scenario."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Groups & Members"
                description="Create groups for trips, roommates, or events. Add temporary members without accounts."
              />
              <FeatureCard
                icon={<Wallet className="h-6 w-6" />}
                title="Debt Management"
                description="See who owes whom at a glance. Simplify debts to minimize transactions."
              />
              <FeatureCard
                icon={<History className="h-6 w-6" />}
                title="Activity History"
                description="Track all changes and settlements. Never lose track of what happened."
              />
              <FeatureCard
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="Settle Up"
                description="Record payments when debts are settled. Keep your balances accurate."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to simplify your shared expenses?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users who have stopped worrying about who owes what.
            </p>
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Receipt className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">SplitEase</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with simplicity in mind. NPR as default currency.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
