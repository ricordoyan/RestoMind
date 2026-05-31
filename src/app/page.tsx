import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MapPin,
  Layers,
  Compass,
  Split,
  Sparkles,
  ShoppingCart,
  Megaphone,
  Utensils,
  Database,
  ShieldCheck,
  TrendingUp,
  Search,
  ClipboardList,
  Calculator,
  Package,
  ListChecks,
  Bot,
} from "lucide-react";

type Tool = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const SUITE: { id: string; label: string; tagline: string; accent: string; tools: Tool[] }[] = [
  {
    id: "locate",
    label: "Locate",
    tagline: "Decide where to open — with data, not gut feel.",
    accent: "from-indigo-500 to-teal-400",
    tools: [
      {
        href: "/analyze",
        title: "Location Analysis",
        description:
          "Score a specific site 1–10, forecast revenue, map nearby competitors, and get a Good Deal / Caution / Avoid verdict.",
        icon: <MapPin className="text-indigo-400" />,
      },
      {
        href: "/trade-area",
        title: "Trade Area Analysis",
        description:
          "Break a location into concentric rings — competitor density, saturation, customer profile, and drive-time reach.",
        icon: <Layers className="text-cyan-400" />,
      },
      {
        href: "/market-scout",
        title: "Market Scout",
        description:
          "White-space analysis: scan a city's neighborhoods and rank the best openings where demand outpaces competition.",
        icon: <Compass className="text-emerald-400" />,
      },
      {
        href: "/impact",
        title: "Impact Analysis",
        description:
          "Cannibalization check: estimate trade-area overlap and how much sales a new site would pull from an existing one.",
        icon: <Split className="text-amber-400" />,
      },
    ],
  },
  {
    id: "build",
    label: "Build",
    tagline: "Turn an empty space into an open restaurant.",
    accent: "from-violet-500 to-fuchsia-500",
    tools: [
      {
        href: "/design",
        title: "Interior Design",
        description:
          "AI design plan from a photo or your square footage and style — layout, mood board, budget tips, and references.",
        icon: <Sparkles className="text-violet-400" />,
      },
      {
        href: "/procurement",
        title: "Smart Procurement",
        description:
          "Equipment & smallwares checklist by category with new-vs-used pricing, scam tips, and marketplace search links.",
        icon: <ShoppingCart className="text-emerald-400" />,
      },
    ],
  },
  {
    id: "operate",
    label: "Operate",
    tagline: "Run the day-to-day like a seasoned manager.",
    accent: "from-sky-500 to-blue-500",
    tools: [
      {
        href: "/recipe-cost",
        title: "Recipe & Food Cost",
        description:
          "Cost a recipe from its ingredients — food-cost %, margin, expensive-ingredient flags, and pricing advice.",
        icon: <Calculator className="text-lime-400" />,
      },
      {
        href: "/inventory",
        title: "Inventory & Ordering",
        description:
          "Track stock against par levels, auto-calculate what to order, flag low stock, and optimize ordering schedules.",
        icon: <Package className="text-sky-400" />,
      },
      {
        href: "/playbook",
        title: "Ops Playbook",
        description:
          "Generate opening/closing checklists, food-safety SOPs, and role-based staff training and onboarding plans.",
        icon: <ListChecks className="text-indigo-400" />,
      },
      {
        href: "/copilot",
        title: "Operations Copilot",
        description:
          "Chat with an AI restaurant manager about food cost, inventory, staffing, menu, and daily operations.",
        icon: <Bot className="text-teal-400" />,
      },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    tagline: "Fill seats and protect your margins.",
    accent: "from-pink-500 to-orange-400",
    tools: [
      {
        href: "/marketing",
        title: "Marketing Co-Pilot",
        description:
          "Social captions, a logo concept, a grand-opening plan, and a 30-day launch marketing checklist.",
        icon: <Megaphone className="text-pink-400" />,
      },
      {
        href: "/menu-engineer",
        title: "Menu Engineer",
        description:
          "Per-dish margin analysis, price tuning, star-dish picks, unprofitable flags, and menu-layout improvements.",
        icon: <Utensils className="text-orange-400" />,
      },
    ],
  },
];

const STEPS = [
  {
    icon: <MapPin className="w-5 h-5" />,
    title: "Tell us the location",
    description: "Enter an address, a city, or two sites to compare. No spreadsheets, no consultants.",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "We pull the real data",
    description: "Live Google Places: competitors, ratings, price levels, and review counts around the site.",
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    title: "Get a grounded report",
    description: "GPT-4o analyzes only that data — scores, risks, and a clear verdict, never invented numbers.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-teal-500/20 blur-[120px]" />
      </div>

      <header className="px-6 py-4 flex items-center justify-between z-20 relative border-b border-white/10 backdrop-blur-md sticky top-0 bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
            <MapPin className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">Restaurant Co-Pilot</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#locate" className="text-slate-300 hover:text-white transition-colors">Locate</a>
          <a href="#build" className="text-slate-300 hover:text-white transition-colors">Build</a>
          <a href="#operate" className="text-slate-300 hover:text-white transition-colors">Operate</a>
          <a href="#grow" className="text-slate-300 hover:text-white transition-colors">Grow</a>
          <a href="#how" className="text-slate-300 hover:text-white transition-colors">How it works</a>
        </nav>
        <Link href="/analyze">
          <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold">
            Analyze a Location
          </Button>
        </Link>
      </header>

      <main className="flex-1 z-10 relative">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center px-4 pt-20 sm:pt-28 pb-16">
          <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-teal-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              AI Location Intelligence for Restaurants
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-teal-100">
              Know before you <br /> sign the lease.
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
              Restaurant Co-Pilot scores a site, forecasts revenue, maps the trade area, and finds
              white-space markets — then helps you design, procure, run food cost, inventory and
              staff training, market, and engineer your menu. One co-pilot for the whole journey.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/analyze">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105"
                >
                  Analyze a Location
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/market-scout">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full font-semibold transition-all hover:scale-105"
                >
                  <Search className="mr-2 w-5 h-5" /> Find a Market
                </Button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Database className="w-4 h-4 text-teal-400" /> Live Google Places data</span>
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> GPT-4o analysis</span>
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Grounded — no invented numbers</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-5xl mx-auto px-4 py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How it works</h2>
            <p className="text-slate-400 mt-3">From a single address to a decision you can defend — in under a minute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Step {i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The Suite */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">One platform, four stages</h2>
            <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
              Everything an operator needs to go from &ldquo;where?&rdquo; to &ldquo;open&rdquo; to &ldquo;running&rdquo; to &ldquo;profitable.&rdquo;
            </p>
          </div>

          <div className="space-y-16">
            {SUITE.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r ${group.accent}`}>
                      {group.label}
                    </span>
                    <span className="h-px flex-1 bg-white/10 hidden sm:block w-24" />
                  </div>
                  <p className="text-sm text-slate-400">{group.tagline}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {group.tools.map((tool) => (
                    <Link key={tool.href} href={tool.href} className="group">
                      <div className="h-full p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          {tool.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-1">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">{tool.description}</p>
                        <span className="text-sm font-medium text-slate-300 group-hover:text-white inline-flex items-center gap-1">
                          Open tool
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-teal-500/20 backdrop-blur-md p-10 sm:p-16 text-center overflow-hidden">
            <TrendingUp className="w-10 h-10 text-teal-300 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Stop guessing. Start with the data.</h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Most restaurants fail on the wrong location. Run the numbers before you commit your capital.
            </p>
            <Link href="/analyze">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full font-semibold shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all hover:scale-105"
              >
                Analyze a Location <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-sm text-slate-500 z-10 relative border-t border-white/10">
        © {new Date().getFullYear()} Restaurant Co-Pilot · AI location intelligence for restaurants · Built with Next.js &amp; OpenAI.
      </footer>
    </div>
  );
}
