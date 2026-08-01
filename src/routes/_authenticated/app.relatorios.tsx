import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · AG Imports" }] }),
  component: Rel,
});

const relatorios = [
  { nome: "Vendas por período", desc: "Detalhamento de pedidos, canais e ticket médio" },
  { nome: "Financeiro consolidado", desc: "Receitas, despesas e fluxo de caixa" },
  { nome: "Estoque e curva ABC", desc: "Posição, giro e produtos parados" },
  { nome: "Marketing e ROAS", desc: "Investimento e retorno por canal" },
  { nome: "Clientes e LTV", desc: "Segmentação, VIPs e inativos" },
  { nome: "Funis de venda", desc: "Conversão por etapa e origem" },
];

function Rel() {
  return (
    <>
      <PageHeader title="Relatórios" description="Exportações completas em PDF e Excel" />
      <SectionCard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {relatorios.map((r) => (
            <div key={r.nome} className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm font-medium">{r.nome}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toast.success(`${r.nome} exportado em PDF`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:border-primary/40"
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => toast.success(`${r.nome} exportado em Excel`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:border-primary/40"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
                <button
                  onClick={() => toast.success(`${r.nome} exportado em CSV`)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:border-primary/40"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
