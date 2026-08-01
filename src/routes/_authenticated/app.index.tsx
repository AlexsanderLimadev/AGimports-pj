import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Box, Package, TrendingUp, Wallet, AlertTriangle, ShoppingBag } from "lucide-react";
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
  head: () => ({ meta: [{ title: "Dashboard · AG Imports" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Nada por aqui.</div>,
});

function Dashboard() {
  const { data } = useSuspenseQuery(statsOptions);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Indicadores em tempo real do seu catálogo e estoque"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="SKUs ativos" value={num(data.activeSkus)} hint={`${num(data.totalSkus)} no total`} icon={<Package className="h-4 w-4" />} />
        <KpiCard label="Unidades em estoque" value={num(data.totalUnits)} icon={<Box className="h-4 w-4" />} />
        <KpiCard label="Valor do estoque (custo)" value={brl(data.stockValueCents)} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard label="Receita potencial" value={brl(data.potentialRevenueCents)} icon={<ShoppingBag className="h-4 w-4" />} />
        <KpiCard label="Lucro potencial" value={brl(data.potentialProfitCents)} icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label="Estoque baixo" value={num(data.lowStock)} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Sem estoque" value={num(data.outOfStock)} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard
          label="Margem média"
          value={
            data.potentialRevenueCents > 0
              ? `${((data.potentialProfitCents / data.potentialRevenueCents) * 100).toFixed(1)}%`
              : "—"
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
