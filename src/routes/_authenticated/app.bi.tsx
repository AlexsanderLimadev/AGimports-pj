import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { brl } from "@/lib/mock/data";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { biOverview } from "@/lib/bi.functions";

const biOptions = queryOptions({
  queryKey: ["bi-overview"],
  queryFn: () => biOverview({ data: {} }) as unknown as Promise<Overview>,
});

export const Route = createFileRoute("/_authenticated/app/bi")({
  head: () => ({ meta: [{ title: "BI · AG Imports" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(biOptions),
  component: BI,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
};

const PALETTE = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)",
];

type Overview = {
  canais: { canal: string; vendas: number }[];
  topProdutos: { nome: string; vendas: number; receita: number }[];
  faturamentoMensal: { mes: string; receita: number; lucro: number }[];
  kpis: {
    receitaTotal: number;
    totalPedidos: number;
    ticketMedio: number;
    totalClientes: number;
    valorEstoque: number;
  };
};

function BI() {
  const { data } = useSuspenseQuery(biOptions);
  const { canais, topProdutos, faturamentoMensal, kpis } = data;

  return (
    <>
      <PageHeader title="Business Intelligence" description="Dados reais dos últimos 6 meses" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KpiCard label="Receita 6m" value={brl(kpis.receitaTotal)} />
        <KpiCard label="Pedidos" value={kpis.totalPedidos} />
        <KpiCard label="Ticket médio" value={brl(kpis.ticketMedio)} />
        <KpiCard label="Clientes" value={kpis.totalClientes} />
        <KpiCard label="Estoque (custo)" value={brl(kpis.valorEstoque)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Faturamento e lucro por mês">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={faturamentoMensal}>
                <CartesianGrid stroke="color-mix(in oklab,var(--color-foreground) 6%,transparent)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                <Line type="monotone" dataKey="receita" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lucro" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Distribuição por canal">
          <div className="h-64">
            {canais.length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem pedidos ainda.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={canais} dataKey="vendas" nameKey="canal" innerRadius={50} outerRadius={90}>
                    {canais.map((_, i) => (<Cell key={i} fill={PALETTE[i % PALETTE.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top produtos por receita" className="lg:col-span-2">
          <div className="h-64">
            {topProdutos.length === 0 ? (
              <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem vendas registradas.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProdutos} layout="vertical">
                  <CartesianGrid stroke="color-mix(in oklab,var(--color-foreground) 6%,transparent)" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="nome" type="category" width={160} stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => brl(v)} />
                  <Bar dataKey="receita" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
