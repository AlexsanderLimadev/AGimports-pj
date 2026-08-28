import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { brl } from "@/lib/mock/data";
import { getMetricasNegocio } from "@/lib/metricas.functions";
import { Info } from "lucide-react";

const metricasOptions = queryOptions({
  queryKey: ["metricas-negocio"],
  queryFn: () => getMetricasNegocio(),
});

export const Route = createFileRoute("/_authenticated/app/metricas")({
  head: () => ({ meta: [{ title: "Métricas de Negócio · AG Imports" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(metricasOptions),
  component: Metricas,
});

function Metric({
  label,
  value,
  hint,
  requisito,
}: {
  label: string;
  value: string | null;
  hint?: string;
  requisito: string;
}) {
  const hasData = value !== null;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {hasData ? (
        <>
          <div className="tabular mt-1 text-2xl font-semibold">{value}</div>
          {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
        </>
      ) : (
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Ainda não existem dados suficientes. {requisito}</span>
        </div>
      )}
    </div>
  );
}

function Metricas() {
  const { data: m } = useSuspenseQuery(metricasOptions);

  const pct = (v: number | null) => (v === null ? null : `${v.toFixed(1)}%`);
  const cents = (v: number | null) => (v === null ? null : brl(v / 100));
  const x = (v: number | null) => (v === null ? null : `${v.toFixed(1)}x`);

  return (
    <>
      <PageHeader
        title="Métricas de Negócio"
        description="Indicadores calculados só com dado real do seu negócio — sem número inventado"
      />

      <SectionCard title="Vendas" className="mb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Ticket médio" value={cents(m.ticketMedio)} requisito="Precisa de pelo menos 1 pedido registrado." />
          <Metric label="Margem" value={pct(m.margemPct)} requisito="Precisa de receita marcada como paga no Financeiro." />
          <Metric label="Pedidos totais" value={m.totalPedidos > 0 ? String(m.totalPedidos) : null} requisito="Nenhum pedido registrado ainda." />
        </div>
      </SectionCard>

      <SectionCard title="Aquisição e retenção" className="mb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric
            label="CAC (custo por cliente)"
            value={cents(m.cacCents)}
            hint={m.cacCents !== null ? `${m.clientesNovos30d} cliente(s) novo(s) em 30 dias` : undefined}
            requisito="Precisa de gasto em campanha (Marketing) e cliente novo nos últimos 30 dias."
          />
          <Metric label="LTV (receita por cliente)" value={cents(m.ltvCents)} requisito="Precisa de cliente com pelo menos 1 pedido." />
          <Metric
            label="LTV / CAC"
            value={x(m.ltvSobreCac)}
            hint={m.ltvSobreCac !== null ? (m.ltvSobreCac >= 3 ? "Saudável (acima de 3x)" : "Abaixo do ideal (3x)") : undefined}
            requisito="Precisa de CAC e LTV calculados."
          />
          <Metric label="ARPU" value={cents(m.arpuCents)} requisito="Precisa de cliente com pelo menos 1 pedido." />
          <Metric
            label="Churn (60 dias)"
            value={pct(m.churnPct)}
            hint="% de clientes que compraram antes e sumiram"
            requisito="Precisa de pelo menos 1 cliente com histórico de compra."
          />
          <Metric label="Clientes totais" value={m.totalClientes > 0 ? String(m.totalClientes) : null} requisito="Nenhum cliente cadastrado ainda." />
        </div>
      </SectionCard>

      <SectionCard title="Marketing">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="ROAS" value={x(m.roasX)} hint="Retorno sobre o investido em anúncio" requisito="Precisa de campanha com gasto registrado." />
          <Metric label="ROI" value={pct(m.roiPct)} requisito="Precisa de campanha com gasto registrado." />
        </div>
      </SectionCard>
    </>
  );
}
