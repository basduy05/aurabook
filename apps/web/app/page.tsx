import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Layers,
  Server,
  Database,
  Cpu,
  Workflow,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const stackItems = [
    {
      title: "Next.js 15 Frontend",
      description: "App Router, TypeScript, Tailwind CSS, Shadcn UI",
      icon: Layers,
      badge: "apps/web",
      status: "Ready",
    },
    {
      title: "FastAPI Backend",
      description: "Python 3.11+, Domain-based architecture, Uvicorn",
      icon: Server,
      badge: "apps/api",
      status: "Ready",
    },
    {
      title: "PostgreSQL 16 & Redis",
      description: "Async SQLAlchemy, connection pooling, Redis cache",
      icon: Database,
      badge: "Docker Local",
      status: "Configured",
    },
    {
      title: "GitHub Actions CI",
      description: "Automated Ruff linter, ESLint, Pytest, Build validation",
      icon: Workflow,
      badge: ".github/workflows",
      status: "Active",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 sm:p-12 md:p-24 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header section */}
      <header className="w-full max-w-6xl flex justify-between items-center z-10 border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AuraBook
            </span>
            <span className="text-xs text-slate-400 ml-2 font-mono">
              monorepo v0.1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> All Systems Initialized
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full max-w-4xl text-center my-16 z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5" /> Next-Gen AI Platform Scaffolding
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            AuraBook
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          High-performance monorepo architecture featuring Next.js 15, FastAPI,
          PostgreSQL, Redis, and automated CI pipelines.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25">
              Explore API Docs <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </a>

          <a
            href="http://localhost:8000/health"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline" className="border-slate-700 bg-slate-900/60 hover:bg-slate-800">
              API Health Status
            </Button>
          </a>
        </div>
      </div>

      {/* Grid of packages */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 z-10 my-8">
        {stackItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="bg-slate-900/50 border-slate-800/80 backdrop-blur-sm hover:border-purple-500/40 transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-purple-400 border border-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-100">
                      {item.title}
                    </CardTitle>
                    <span className="text-xs font-mono text-slate-400">
                      {item.badge}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-800/80 text-slate-300 border-slate-700"
                >
                  {item.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 text-sm mt-2">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center z-10 border-t border-slate-800/80 pt-6 text-xs text-slate-500 gap-4">
        <div>&copy; {new Date().getFullYear()} AuraBook. Ready for development.</div>
        <div className="flex gap-4">
          <span>Docker Ready</span>
          <span>•</span>
          <span>CI Pipeline Configured</span>
          <span>•</span>
          <span>Domain Architecture</span>
        </div>
      </footer>
    </main>
  );
}
