import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Download, Lightbulb, Loader2, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { getAnaliseNegocio } from "@/lib/analise.functions";
import { gerarInsights, type Insight } from "@/lib/insights";
import { exportElementToPDF } from "@/lib/exportToPDF";
import { brl } from "@/lib/mock/data";

const analiseOptions = queryOptions({
  queryKey: ["analise-negocio"],
  queryFn: () => getAnaliseNegocio(),
});

export const Route = createFileRoute("/_authenticated/app/dashboard-analitico")({
  head: () => ({ meta: [{ title: "Dashboard Analítico · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(analiseOptions),
  component: DashboardAnalitico,
});

const cents = (v: number) => brl(v / 100);

function Destaque({ titulo, nome, detalhe }: { titulo: string; nome?: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] text-muted-foreground">{titulo}</div>
      {nome ? (
        <>
          <div className="mt-1 truncate text-base font-semibold">{nome}</div>
          {detalhe && <div className="tabular mt-0.5 text-xs text-muted-foreground">{detalhe}</div>}
        </>
      ) : (
        <div className="mt-2 text-[11px] text-muted-foreground">Dado insuficiente</div>
      )}
    </div>
  );
}

const iconeInsight: Record<Insight["tipo"], typeof AlertTriangle> = {
  alerta: AlertTriangle,
  oportunidade: Lightbulb,
  positivo: TrendingUp,
};

function DashboardAnalitico() {
  const { data: a } = useSuspenseQuery(analiseOptions);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const insights = gerarInsights(a);

  async function exportar() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      await exportElementToPDF(reportRef.current, "dashboard-analitico");
      toast.success("PDF gerado");
    } catch {
      toast.error("Não foi possível gerar o PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Dashboard Analítico"
        description="Produtos, faturamento, retorno e equipe, calculados só com dado real"
        actions={
          <Button variant="outline" size="sm" onClick={exportar} disabled={exporting}>
            {exporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
            Exportar PDF
          </Button>
        }
      />

      <div ref={reportRef} className="space-y-4 bg-background">
        <SectionCard title="Financeiro">
          <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
            <KpiCard
              label="Faturamento do mês"
              value={cents(a.mesAtualCents)}
              delta={a.mesVariacaoPct ?? undefined}
              hint={a.mesVariacaoPct === null ? "Sem mês anterior para comparar" : "vs mês anterior"}
            />
            <KpiCard
              label="Faturamento do ano"
              value={cents(a.anoAtualCents)}
              delta={a.anoVariacaoPct ?? undefined}
              hint={a.anoVariacaoPct === null ? "Sem ano anterior para comparar" : "vs ano anterior"}
            />
            <KpiCard
              label="ROI dos produtos"
              value={a.roiPct === null ? "Sem dado" : `${a.roiPct.toFixed(1)}%`}
              hint={a.roiPct === null ? "Informe o custo dos produtos" : "(receita menos custo) / custo"}
              tone={a.roiPct === null ? "neutral" : a.roiPct >= 20 ? "success" : "warning"}
            />
            <KpiCard label="Pedidos válidos" value={String(a.totalPedidos)} hint="Exclui cancelados" />
          </div>
        </SectionCard>

        <SectionCard title="Produtos">
          <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
            <Destaque titulo="Mais barato" nome={a.maisBarato?.nome} detalhe={a.maisBarato ? cents(a.maisBarato.priceCents) : undefined} />
            <Destaque titulo="Mais caro" nome={a.maisCaro?.nome} detalhe={a.maisCaro ? cents(a.maisCaro.priceCents) : undefined} />
            <Destaque titulo="Mais vendido" nome={a.maisVendido?.nome} detalhe={a.maisVendido ? `${a.maisVendido.qtd} un. · ${cents(a.maisVendido.receitaCents)}` : undefined} />
            <Destaque titulo="Menos vendido" nome={a.menosVendido?.nome} detalhe={a.menosVendido ? `${a.menosVendido.qtd} un. · ${cents(a.menosVendido.receitaCents)}` : undefined} />
          </div>
        </SectionCard>

        <SectionCard title="Equipe de vendas">
          {a.totalVendedores === 0 ? (
            <EmptyState
              icon={<Trophy className="h-4 w-4" />}
              title="Nenhum vendedor registrado"
              description="Informe o vendedor ao criar um pedido para ver o ranking aqui."
            />
          ) : (
            <ul className="divide-y divide-border">
              {a.ranking.map((v, i) => (
                <li key={v.nome} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="tabular w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="truncate font-medium">{v.nome}</span>
                  </span>
                  <span className="tabular shrink-0 text-right">
                    {cents(v.totalCents)}
                    <span className="ml-2 text-xs text-muted-foreground">{v.pedidos} pedido(s)</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Inteligência do negócio">
          {insights.length === 0 ? (
            <EmptyState title="Sem insights ainda" description="Registre pedidos e custos de produtos para gerar recomendações." />
          ) : (
            <ul className="divide-y divide-border">
              {insights.map((ins, i) => {
                const Icon = iconeInsight[ins.tipo];
                return (
                  <li key={i} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{ins.texto}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
