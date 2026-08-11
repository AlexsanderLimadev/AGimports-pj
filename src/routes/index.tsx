import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useLayoutEffect, type ReactNode } from "react";
import {
  ArrowRight, ArrowUp, Menu, X, Activity, Monitor, PanelLeftClose,
  ChevronLeft, ChevronRight, RotateCw, Share, Plus, Copy, LayoutDashboard,
  Package, Boxes, ListTodo,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AGLogo, Grain, Grid, useMouseRel } from "@/components/brand-fx";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export const Route = createFileRoute("/")({
  component: Landing,
});

const BG_URL =
  "https://images.unsplash.com/photo-1671159593357-ee577a598f71?w=1920&h=1080&fit=crop&auto=format&q=80";

const MODULOS = [
  ["Dashboard", "KPIs em tempo real"],
  ["Produtos", "CRUD completo"],
  ["Estoque", "Movimentações e alertas"],
  ["Calculadora", "Precificação"],
  ["CRM", "Clientes VIP · Atacado"],
  ["Marketing", "ROI por canal"],
  ["Financeiro", "Fluxo de caixa"],
  ["BI", "Decisão por dados"],
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <AGLogo size={34} />
      <span className="font-semibold text-white/88" style={{ fontSize: 13, letterSpacing: "-0.025em" }}>
        AG Imports
      </span>
    </div>
  );
}

/** Escala um mockup de largura fixa pra caber no espaço disponível. */
function ScaledMockup({ children, designW = 860 }: { children: ReactNode; designW?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (!outer.current || !inner.current) return;
    const measure = () => {
      const w = outer.current!.getBoundingClientRect().width;
      setScale(w / designW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer.current);
    return () => ro.disconnect();
  }, [designW]);

  const innerH = inner.current?.offsetHeight ?? 0;

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: innerH * scale || "auto" }}>
      <div ref={inner} style={{ width: designW, transformOrigin: "top left", transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

/** Mockup ilustrativo do painel — só decorativo, dados de exemplo. */
function DashMockup() {
  const stats = [
    { label: "SKUS ATIVOS", val: "284", sub: "itens no catálogo" },
    { label: "EM ESTOQUE", val: "1.842", sub: "unidades totais" },
    { label: "RECEITA POTENCIAL", val: "R$ 2,3M", sub: "preço × quantidade" },
    { label: "MARGEM MÉDIA", val: "38%", sub: "sobre custo" },
  ];
  const rows = [
    { name: "Tênis Nike Air Max 90", vol: "4.200", diff: "Médio", status: "Rascunho" },
    { name: "Camiseta Lacoste Polo", vol: "3.800", diff: "Baixo", status: "Publicado" },
    { name: "Bolsa Michael Kors Jet Set", vol: "2.900", diff: "Alto", status: "Rascunho" },
    { name: "Óculos Ray-Ban Aviator", vol: "2.400", diff: "Médio", status: "Publicado" },
  ];

  return (
    <div className="rounded-t-2xl overflow-hidden bg-[#141416] ring-1 ring-white/10 shadow-[0_-24px_80px_rgba(0,0,0,0.5)] text-left">
      <div className="bg-[#1e1e20] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5">
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} className="w-2.5 h-2.5 rounded-full block" style={{ background: c }} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <PanelLeftClose size={13} />
          <ChevronLeft size={13} />
          <ChevronRight size={13} className="text-white/15" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-1.5 bg-[#141416] rounded-md px-5 py-[3px]">
            <Monitor size={10} className="text-white/40" />
            <span className="text-[10px] text-white/50" style={{ fontFamily: "var(--font-mono)" }}>
              agimports.app
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/30">
          <RotateCw size={12} />
          <Share size={12} />
          <Plus size={12} />
          <Copy size={12} />
        </div>
      </div>

      <div className="flex" style={{ minHeight: 380 }}>
        <div className="w-[17%] border-r border-white/[0.05] bg-[#1a1a1c] px-3 py-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <AGLogo size={20} rounded="rounded" />
            <LayoutDashboard size={12} className="text-white/25" />
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            {[
              { icon: LayoutDashboard, label: "Dashboard" },
              { icon: Package, label: "Produtos" },
              { icon: Boxes, label: "Estoque" },
              { icon: ListTodo, label: "Pedidos" },
            ].map(({ icon: Icon, label }, i) => (
              <div key={label} className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md ${i === 0 ? "bg-white/[0.08]" : ""}`}>
                <Icon size={10} className={i === 0 ? "text-white/80" : "text-white/35"} />
                <span className={`text-[9px] ${i === 0 ? "text-white/80" : "text-white/40"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-4 divide-x divide-white/[0.06] rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-3">
                <p className="text-[7px] tracking-widest text-white/30 mb-1" style={{ fontFamily: "var(--font-mono)" }}>
                  {s.label}
                </p>
                <p className="text-[18px] font-semibold text-white/88" style={{ letterSpacing: "-0.03em" }}>{s.val}</p>
                <p className="text-[8px] text-white/28 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05] overflow-hidden">
            <div className="grid border-b border-white/[0.05] px-4 py-2" style={{ gridTemplateColumns: "1fr 80px 80px 90px" }}>
              {["Produto", "Volume", "Dificuldade", "Status"].map((h) => (
                <span key={h} className="text-[8px] uppercase tracking-wider text-white/22" style={{ fontFamily: "var(--font-mono)" }}>
                  {h}
                </span>
              ))}
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid border-b border-white/[0.04] px-4 py-2.5" style={{ gridTemplateColumns: "1fr 80px 80px 90px" }}>
                <span className="text-[10px] text-white/65">{r.name}</span>
                <span className="text-[10px] text-white/40" style={{ fontFamily: "var(--font-mono)" }}>{r.vol}</span>
                <span className="text-[10px] text-white/40">{r.diff}</span>
                <span
                  className="text-[10px]"
                  style={{
                    color: r.status === "Publicado" ? "rgba(40,200,64,0.75)" : "rgba(254,188,46,0.75)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);
  const mousePos = useMouseRel(pageRef);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  const cta = signedIn ? "/app" : "/auth";
  const ctaLabel = signedIn ? "Ir ao painel" : "Entrar";

  return (
    <div
      ref={pageRef}
      className="relative min-h-[100svh] overflow-hidden flex flex-col"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-1000"
        style={{
          background: `radial-gradient(900px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.04) 0%, transparent 55%)`,
        }}
      />
      <Grid />
      <Grain />

      <nav className="anim-down relative z-20 flex items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Brand />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <InteractiveHoverButton
              text={ctaLabel}
              onClick={() => navigate({ to: cta })}
              className="w-auto border-white/20 bg-white px-5 py-2 text-black [--primary:black] [--primary-foreground:white]"
            />
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden w-9 h-9 rounded-full text-white/60 hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="absolute left-4 right-4 top-full rounded-2xl bg-black/80 backdrop-blur-xl ring-1 ring-white/10 px-5 py-3 flex flex-col sm:hidden">
            <Link to={cta} className="flex items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-[13px] font-medium text-black">
              {ctaLabel} <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </nav>

      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-14 shrink-0" />

      <ContainerScroll
        titleComponent={
          <div className="relative z-10 flex flex-col items-center px-5 text-center">
            <div className="anim-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-1.5 backdrop-blur-sm">
              <Activity size={11} className="text-white/45" />
              <span className="text-[10px] tracking-[0.18em] text-white/45" style={{ fontFamily: "var(--font-mono)" }}>
                ERP · CRM · BI · FUNIS
              </span>
            </div>

            <h1 className="text-white font-semibold leading-[1.06] tracking-[-0.03em]" style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
              <span className="block anim-up" style={{ animationDelay: "40ms" }}>Toda a operação</span>
              <span className="block anim-up text-white/40" style={{ animationDelay: "120ms" }}>em um só lugar.</span>
            </h1>

            <form
              className="anim-up mt-7 w-full max-w-lg"
              style={{ animationDelay: "240ms" }}
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = cta;
              }}
            >
              <div className="flex items-center gap-3 rounded-full bg-white/[0.08] backdrop-blur-md ring-1 ring-white/[0.12] pl-5 pr-1.5 py-1.5">
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Buscar produto, pedido ou cliente..."
                  className="flex-1 bg-transparent text-[13px] text-white/80 placeholder:text-white/30 outline-none py-2"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
                >
                  <ArrowUp size={15} />
                </button>
              </div>
            </form>

            <p className="anim-up mt-5 max-w-md text-[14px] leading-relaxed text-white/35" style={{ animationDelay: "360ms" }}>
              Gestão premium de importados: vendas, estoque, financeiro e
              <br />
              marketing com indicadores em tempo real.
            </p>

            <div className="anim-up mt-5 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "460ms" }}>
              <InteractiveHoverButton
                text={signedIn ? "Acessar painel" : "Criar conta"}
                onClick={() => navigate({ to: cta })}
                className="w-auto border-white/20 bg-white px-6 py-2.5 text-black [--primary:black] [--primary-foreground:white]"
              />
              <a href="#modulos" className="rounded-full ring-1 ring-white/20 px-6 py-2.5 text-[13px] text-white/55 hover:bg-white/[0.07] transition-colors">
                Ver módulos
              </a>
            </div>
          </div>
        }
      >
        <ScaledMockup designW={860}>
          <DashMockup />
        </ScaledMockup>
      </ContainerScroll>

      <div id="modulos" className="relative z-10 mx-auto -mt-64 w-full max-w-5xl px-5 pb-24 pt-40 sm:-mt-96 sm:pt-56">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl ring-1 ring-white/[0.08] sm:grid-cols-4">
          {MODULOS.map(([t, d]) => (
            <div key={t} className="bg-white/[0.03] p-4 text-left backdrop-blur-sm">
              <div className="text-[12px] font-medium text-white/80">{t}</div>
              <div className="mt-0.5 text-[10px] text-white/30">{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
