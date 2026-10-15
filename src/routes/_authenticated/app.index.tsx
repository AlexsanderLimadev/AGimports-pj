import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Box, Package, TrendingUp, Wallet, AlertTriangle, ShoppingBag, X, PartyPopper, ArrowRight } from "lucide-react";
import { KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { dashboardStats } from "@/lib/products.functions";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const num = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

const statsOptions = queryOptions({
  queryKey: ["dashboard-stats"],
  queryFn: () => dashboardStats(),
});

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Dashboard · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Nada por aqui.</div>,
});

const ONBOARDING_DISMISSED_KEY = "ag-onboarding-dismissed";
const WELCOMED_KEY = "ag-welcomed";

function OnboardingChecklist({ hasProducts }: { hasProducts: boolean }) {
  const [dismissed, setDismissed] = useState(true);
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1");
      if (!localStorage.getItem(WELCOMED_KEY)) {
        setFirstVisit(true);
        localStorage.setItem(WELCOMED_KEY, "1");
      }
    } catch {
      // sem localStorage (ex.: navegação privada) — só não mostra onboarding
    }
  }, []);

  // Onboarding some sozinho assim que a conta deixa de estar "vazia" —
  // baseado em dado real (tem produto cadastrado), não numa bandeirinha
  // que o usuário precisaria lembrar de desmarcar.
  if (hasProducts || dismissed) return null;

  function dismiss() {
    try { localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1"); } catch {}
    setDismissed(true);
  }

  const steps = [
    { label: "Cadastre seu primeiro produto", to: "/app/produtos" },
    { label: "Adicione um cliente", to: "/app/clientes" },
    { label: "Configure sua agenda", to: "/app/agenda" },
  ];

  return (
    <div className="mb-4 rounded-xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <PartyPopper className="h-4 w-4 text-primary" />
            {firstVisit ? "Seja bem-vindo(a) à AG Tech!" : "Vamos começar"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Alguns passos rápidos pra deixar seu painel pronto pra uso:
          </p>
        </div>
        <button onClick={dismiss} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {steps.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:border-primary/40"
          >
            {s.label} <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { data } = useSuspenseQuery(statsOptions);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Indicadores em tempo real do seu catálogo e estoque"
      />

      <OnboardingChecklist hasProducts={data.totalSkus > 0} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard delayMs={0} label="SKUs ativos" value={num(data.activeSkus)} hint={`${num(data.totalSkus)} no total`} icon={<Package className="h-4 w-4" />} />
        <KpiCard delayMs={30} label="Unidades em estoque" value={num(data.totalUnits)} icon={<Box className="h-4 w-4" />} />
        <KpiCard delayMs={60} label="Valor do estoque (custo)" value={brl(data.stockValueCents)} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard delayMs={90} label="Receita potencial" value={brl(data.potentialRevenueCents)} icon={<ShoppingBag className="h-4 w-4" />} />
        <KpiCard delayMs={120} label="Lucro potencial" value={brl(data.potentialProfitCents)} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard delayMs={150} label="Estoque baixo" value={num(data.lowStock)} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard delayMs={180} label="Sem estoque" value={num(data.outOfStock)} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard
          delayMs={210}
          label="Margem média"
          value={
            data.potentialRevenueCents > 0
              ? `${((data.potentialProfitCents / data.potentialRevenueCents) * 100).toFixed(1)}%`
              : "-"
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Movimentações recentes" description="Últimas entradas, saídas e ajustes">
          {data.recentMoves.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma movimentação ainda. Adicione produtos e comece a operar.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.recentMoves.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.products?.name ?? "Produto removido"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  </div>
                  <span
                    className={`tabular rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.move_type === "in"
                        ? "bg-primary/10 text-primary"
                        : m.move_type === "out"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {m.move_type === "in" ? "+" : m.move_type === "out" ? "−" : "="}
                    {m.qty}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Começar" description="Próximos passos recomendados">
          <ol className="space-y-3 text-sm">
            <Step n={1} title="Cadastre seus produtos" desc="Adicione SKU, preço, custo e estoque inicial." />
            <Step n={2} title="Registre movimentações" desc="Entradas, saídas e ajustes atualizam o estoque em tempo real." />
            <Step n={3} title="Acompanhe alertas" desc="Produtos abaixo do mínimo aparecem no painel." />
          </ol>
        </SectionCard>
      </div>
    </>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </li>
  );
}
