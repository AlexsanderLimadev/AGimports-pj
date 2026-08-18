import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useLayoutEffect, type ReactNode } from "react";
import {
  ArrowRight, ArrowUp, Menu, X, Activity, Monitor, PanelLeftClose,
  ChevronLeft, ChevronRight, RotateCw, Share, Plus, Copy, LayoutDashboard,
  Package, Boxes, ListTodo, MoreVertical, UserPlus, Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolveSearch } from "@/lib/search-routes";
import { AGLogo, Grain, Grid, useMouseRel } from "@/components/brand-fx";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AG Imports · ERP para importadores de moda e acessórios" },
      {
        name: "description",
        content:
          "Sistema completo de gestão para importadores: controle de estoque, pedidos, financeiro, CRM e funis de venda em um só lugar, com indicadores em tempo real.",
      },
      { property: "og:title", content: "AG Imports · ERP para importadores de moda e acessórios" },
      {
        property: "og:description",
        content:
          "Sistema completo de gestão para importadores: estoque, pedidos, financeiro, CRM e BI em tempo real.",
      },
    ],
  }),
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const pageRef = useRef<HTMLDivElement>(null);
  const mousePos = useMouseRel(pageRef);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setUserEmail(data.session?.user.email ?? null);
    });
  }, []);

  // "Minhas contas": hoje o sistema só suporta 1 conta por login — a troca
  // entre até 3 empresas por usuário ainda não foi implementada no banco
  // (é uma mudança de arquitetura maior, escopada à parte). Por enquanto
  // mostramos só a conta real e atual, sem fingir uma função que não existe.
  const accounts = signedIn && userEmail ? [{ id: "current", label: userEmail, active: true }] : [];

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
          <Link
            to={cta}
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-[13px] font-medium text-black hover:bg-white/90 transition-colors duration-150"
          >
            {ctaLabel} <ArrowRight size={13} />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Mais opções de conta"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/[0.1] hover:text-white/90"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-white/10 bg-[#141416] text-white/80">
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.08] focus:text-white">
                <Link to="/app" className="flex items-center gap-2">
                  <LayoutDashboard size={14} className="text-white/40" /> Acessar meu painel
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/[0.08] focus:text-white">
                <Link to="/auth" search={{ mode: "signup" }} className="flex items-center gap-2">
                  <UserPlus size={14} className="text-white/40" /> Criar conta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-white/30" style={{ fontFamily: "var(--font-mono)" }}>
                Minhas contas ({accounts.length}/3)
              </DropdownMenuLabel>
              {accounts.map((acc) => (
                <DropdownMenuItem
                  key={acc.id}
                  onClick={() => toast.message("Essa já é sua conta atual")}
                  className="flex cursor-pointer items-center justify-between text-white/50 focus:bg-white/[0.08] focus:text-white/70"
                >
                  <span className="flex items-center gap-2">
                    <Users size={14} className="text-white/30" /> {acc.label}
                  </span>
                  {acc.active && <span className="text-[10px] text-white/30">atual</span>}
                </DropdownMenuItem>
              ))}
              {accounts.length < 3 && (
                <DropdownMenuItem
                  onClick={() =>
                    toast.message("Múltiplas empresas ainda não está disponível", {
                      description: "Essa função está em desenvolvimento e chega em breve.",
                    })
                  }
                  className="flex cursor-pointer items-center gap-2 text-white/40 focus:bg-white/[0.08] focus:text-white/60"
                >
                  <Plus size={14} /> Adicionar outra empresa (em breve)
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
                const q = searchVal.trim();
                if (!q) return;

                const match = resolveSearch(q);
                if (!match) {
                  toast.error(`Não encontrei nada pra "${q}". Tenta produtos, pedidos, clientes, estoque...`);
                  return;
                }
                if (!signedIn) {
                  toast.message("Você ainda não tem uma conta", {
                    description: `Crie uma conta pra acessar ${match.label}.`,
                  });
                  navigate({ to: "/auth", search: { mode: "signup" } });
                  return;
                }
                navigate({ to: match.path });
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
              <Link to={cta} className="rounded-full bg-white px-6 py-2.5 text-[13px] font-medium text-black hover:bg-white/90 transition-colors">
                {signedIn ? "Acessar painel" : "Criar conta"}
              </Link>
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
        <div className="anim-up mx-auto mb-10 max-w-xl text-center">
          <span
            className="text-[10px] tracking-[0.18em] text-white/30"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            TUDO QUE UM IMPORTADOR PRECISA
          </span>
          <h2 className="mt-3 text-[26px] font-semibold leading-tight text-white/85" style={{ letterSpacing: "-0.02em" }}>
            Sem planilha solta, sem sistema separado pra cada área.
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/35">
            O AG Imports substitui as ferramentas soltas do dia a dia por um único lugar,
            do controle de estoque à decisão de preço, do primeiro contato com o cliente
            ao fechamento do caixa do mês.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl ring-1 ring-white/[0.08] sm:grid-cols-4">
          {MODULOS.map(([t, d]) => (
            <div key={t} className="bg-white/[0.03] p-4 text-left backdrop-blur-sm">
              <div className="text-[12px] font-medium text-white/80">{t}</div>
              <div className="mt-0.5 text-[10px] text-white/30">{d}</div>
            </div>
          ))}
        </div>
      </div>

      <FaqSection />

      {/* CTA fixo no rodapé, só em telas pequenas — some quando o menu
          mobile está aberto, pra não empilhar dois botões na tela. */}
      {!mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/80 p-3 backdrop-blur-lg sm:hidden">
          <Link
            to={cta}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white py-3 text-[13px] font-medium text-black"
          >
            {signedIn ? "Acessar painel" : "Criar conta grátis"} <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

const FAQ_ITEMS: [string, string][] = [
  [
    "Preciso instalar algo pra usar o AG Imports?",
    "Não. É 100% web — você acessa pelo navegador, de qualquer computador ou celular, sem instalar nada.",
  ],
  [
    "Meus dados ficam seguros?",
    "Sim. Cada conta só enxerga os próprios dados (proteção aplicada diretamente no banco, não só na tela), e você pode exportar ou excluir seus dados a qualquer momento.",
  ],
  [
    "Dá pra importar meu estoque que já existe em planilha?",
    "O cadastro de produtos é feito direto na plataforma. Se você já tem uma planilha, a equipe pode te orientar no processo de migração inicial.",
  ],
  [
    "O sistema serve pra varejo, atacado, ou os dois?",
    "Os dois. Dá pra segmentar clientes e pedidos por canal (varejo, atacado, marketplace) e acompanhar cada um separadamente nos relatórios.",
  ],
  [
    "Preciso de internet pra usar?",
    "Sim, é um sistema online — funciona em qualquer lugar com conexão, e os dados ficam sempre atualizados em tempo real entre dispositivos.",
  ],
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-28 sm:pb-24">
      <h2 className="text-center text-[22px] font-semibold text-white/85" style={{ letterSpacing: "-0.02em" }}>
        Perguntas frequentes
      </h2>
      <div className="mt-6 divide-y divide-white/[0.08] rounded-xl border border-white/[0.08]">
        {FAQ_ITEMS.map(([q, a], i) => (
          <div key={q}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[13px] text-white/75 hover:text-white"
            >
              {q}
              <span className={`shrink-0 text-white/30 transition-transform ${open === i ? "rotate-45" : ""}`}>
                <Plus size={16} />
              </span>
            </button>
            {open === i && <p className="px-4 pb-4 text-[12px] leading-relaxed text-white/40">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
