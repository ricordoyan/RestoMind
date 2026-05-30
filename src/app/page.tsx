import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, TrendingUp, ShieldAlert, Sparkles, ShoppingCart, Megaphone, Utensils } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/20 blur-[120px]" />
      </div>

      <header className="px-6 py-4 flex items-center justify-between z-10 relative border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
            <MapPin className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Co-Pilot</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/analyze" className="text-slate-300 hover:text-white transition-colors">
            Location Analysis
          </Link>
          <Link href="/design" className="text-slate-300 hover:text-white transition-colors">
            Interior Design
          </Link>
          <Link href="/procurement" className="text-slate-300 hover:text-white transition-colors">
            Procurement
          </Link>
          <Link href="/marketing" className="text-slate-300 hover:text-white transition-colors">
            Marketing
          </Link>
          <Link href="/menu-engineer" className="text-slate-300 hover:text-white transition-colors">
            Menu Engineer
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-teal-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            GPT-4o Powered Restaurant Intelligence
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-teal-100">
            Your AI Co-Pilot for <br />
            Restaurant Success
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Evaluate locations, forecast revenue, assess risks, design your interior, and procure equipment &mdash; all powered by AI.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center flex-wrap justify-center">
            <Link href="/analyze">
              <Button size="lg" className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                Analyze a Location
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/design">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-semibold transition-all hover:scale-105">
                <Sparkles className="mr-2 w-5 h-5" /> Design Your Space
              </Button>
            </Link>
            <Link href="/procurement">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-semibold transition-all hover:scale-105">
                <ShoppingCart className="mr-2 w-5 h-5" /> Smart Procurement
              </Button>
            </Link>
            <Link href="/marketing">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-semibold transition-all hover:scale-105">
                <Megaphone className="mr-2 w-5 h-5" /> Marketing Co-Pilot
              </Button>
            </Link>
            <Link href="/menu-engineer">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-semibold transition-all hover:scale-105">
                <Utensils className="mr-2 w-5 h-5" /> Menu Engineer
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mt-24 max-w-7xl mx-auto text-left w-full">
          <FeatureCard 
            icon={<MapPin className="text-indigo-400" />}
            title="Local Intelligence"
            description="Analyzes demographics, nearby competitors, and neighborhood trends instantly."
          />
          <FeatureCard 
            icon={<TrendingUp className="text-teal-400" />}
            title="Revenue Forecasting"
            description="Predicts realistic daily and monthly revenue ranges based on foot traffic and area."
          />
          <FeatureCard 
            icon={<ShieldAlert className="text-rose-400" />}
            title="Risk Assessment"
            description="Identifies top localized risks and provides smart negotiation strategies."
          />
          <FeatureCard 
            icon={<Sparkles className="text-amber-400" />}
            title="Interior Design"
            description="AI-powered design plans with layout, mood board, and budget-friendly tips."
          />
          <FeatureCard 
            icon={<ShoppingCart className="text-emerald-400" />}
            title="Smart Procurement"
            description="Tailored equipment checklists with new vs. used pricing and marketplace links."
          />
          <FeatureCard 
            icon={<Megaphone className="text-pink-400" />}
            title="Marketing Co-Pilot"
            description="Social media captions, logo concepts, grand opening plans, and 30-day checklists."
          />
          <FeatureCard 
            icon={<Utensils className="text-orange-400" />}
            title="Menu Engineer"
            description="Profit margin analysis, price optimization, star dishes, and menu layout tips."
          />
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 z-10 relative">
        © {new Date().getFullYear()} Restaurant Co-Pilot. Built with Next.js & OpenAI.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
