import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/ag-imports-logo.png";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const cta = signedIn ? "/app" : "/auth";
  const ctaLabel = signedIn ? "Ir ao painel" : "Entrar";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_oklab,var(--color-foreground)_4%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-foreground)_4%,transparent)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="AG Imports" className="h-9 w-9 rounded-md bg-white p-1 ring-1 ring-border" />
          <span className="text-sm font-semibold tracking-tight">AG Imports</span>
        </div>
        <Link
          to={cta}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/40"
        >
          {ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-20 text-center sm:pt-32">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> ERP · CRM · BI · Funis
        </span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Toda a operação da{" "}
          <span className="bg-gradient-to-b from-primary to-primary/60 bg-clip-text text-transparent">
            AG Imports
          </span>
          , em um só lugar.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
          Gestão premium de vendas, estoque, financeiro, marketing e funis — com
          indicadores em tempo real para varejo e atacado de importados.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={cta}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {signedIn ? "Acessar painel" : "Criar conta"} <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#modulos"
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/40"
          >
            Ver módulos
          </a>
        </div>

        <div
          id="modulos"
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4"
        >
          {[
            ["Dashboard", "KPIs em tempo real"],
            ["Produtos", "CRUD completo"],
            ["Estoque", "Movimentações e alertas"],
            ["Calculadora", "Precificação"],
            ["CRM", "Clientes VIP · Atacado"],
            ["Marketing", "ROI por canal"],
            ["Financeiro", "Fluxo de caixa"],
            ["BI", "Decisão por dados"],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-4 text-left">
              <div className="text-xs font-medium">{t}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
