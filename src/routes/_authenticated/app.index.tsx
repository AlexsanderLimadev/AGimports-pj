import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Box, Package, TrendingUp, Wallet, AlertTriangle, ShoppingBag, X, PartyPopper, ArrowRight, Check } from "lucide-react";
import { KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { dashboardStats } from "@/lib/products.functions";
import { getContagemConta } from "@/lib/primeiros-passos.functions";
import { calcularPassos } from "@/lib/primeiros-passos-calc";
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
  notFoundComponent: () => <div className="p-6">Nada por aqui.</div>,
});

const ONBOARDING_DISMISSED_KEY = "ag-onboarding-dismissed";

/** Lista de primeiros passos. Cada item some do "a fazer" sozinho quando o dado real existe. */
function PrimeirosPassosCard() {
  const [dispensado, setDispensado] = useState(true);
  const { data } = useQuery({
    queryKey: ["primeiros-passos"],
    queryFn: () => getContagemConta(),
    staleTime: 30_000,
    retry: false,
  });

  useEffect(() => {
    try {
      setDispensado(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1");
    } catch {
      // sem localStorage (ex.: janela anônima): mostra a lista sem poder lembrar do "fechar"
      setDispensado(false);
    }
  }, []);

  if (!data || dispensado) return null;
  const r = calcularPassos(data);
  if (r.concluido) return null;

  function fechar() {
    try { localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1"); } catch {}
    setDispensado(true);
  }

  return (
    <section aria-label="Primeiros passos" className="mb-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PartyPopper className="h-4 w-4" />
            Primeiros passos
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {r.feitos} de {r.total} feitos. Cada passo libera uma parte do sistema.
          </p>
        </div>
        <button onClick={fechar} aria-label="Fechar primeiros passos" className="rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={r.total} aria-valuenow={r.feitos}>
        <div className="h-full rounded-full bg-foreground transition-[width] duration-300" style={{ width: `${(r.feitos / r.total) * 100}%` }} />
      </div>

      <ul className="mt-3 divide-y divide-border">
        {r.passos.map((p) => (
          <li key={p.id}>
            <Link
              to={p.to}
              className="flex items-start gap-3 py-2.5 text-sm transition-colors hover:text-foreground"
            >
              <span
                className={
                  p.feito
                    ? "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-foreground text-background"
                    : "mt-0.5 h-5 w-5 shrink-0 rounded-full border border-border"
                }
                aria-hidden="true"
              >
                {p.feito && <Check className="h-3 w-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={p.feito ? "block text-muted-foreground line-through" : "block font-medium"}>
                  {p.titulo}
                  {p.opcional && <span className="ml-2 text-xs font-normal text-muted-foreground no-underline">opcional</span>}
                </span>
                {!p.feito && <span className="block text-xs text-muted-foreground">{p.descricao}</span>}
              </span>
              {!p.feito && <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
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

      <PrimeirosPassosCard />

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

      <div className="mt-6 grid grid-cols-1 gap-4">
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

      </div>
    </>
  );
}
