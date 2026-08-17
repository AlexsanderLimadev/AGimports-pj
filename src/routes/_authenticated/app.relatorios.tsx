import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toCsv, downloadCsv, csvDate, csvMoney } from "@/lib/csv";
import { listPedidos } from "@/lib/pedidos.functions";
import { listLancamentos } from "@/lib/financeiro.functions";
import { listClientes } from "@/lib/clientes.functions";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios · AG Imports" }] }),
  component: Rel,
});

type Relatorio = {
  nome: string;
  desc: string;
  // undefined = ainda não implementado de verdade (mostra "em breve" em
  // vez de fingir que exportou algo, como a tela fazia antes).
  run?: () => Promise<void>;
};

function Rel() {
  const listPedidosFn = useServerFn(listPedidos);
  const listLancamentosFn = useServerFn(listLancamentos);
  const listClientesFn = useServerFn(listClientes);
  const [loading, setLoading] = useState<string | null>(null);

  async function exportar(nome: string, run: () => Promise<void>) {
    setLoading(nome);
    try {
      await run();
      toast.success(`${nome} exportado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao exportar");
    } finally {
      setLoading(null);
    }
  }

  const relatorios: Relatorio[] = [
    {
      nome: "Vendas por período",
      desc: "Pedidos com status, canal e valor total",
      run: async () => {
        const rows = await listPedidosFn();
        downloadCsv(
          "vendas-por-periodo",
          toCsv(rows, [
            { header: "Número", value: (r) => r.numero },
            { header: "Cliente", value: (r) => (r as any).clientes?.nome ?? r.cliente_nome_snapshot ?? "" },
            { header: "Canal", value: (r) => r.canal },
            { header: "Status", value: (r) => r.status },
            { header: "Total (R$)", value: (r) => csvMoney(r.total_cents) },
            { header: "Data", value: (r) => csvDate(r.created_at) },
          ]),
        );
      },
    },
    {
      nome: "Financeiro consolidado",
      desc: "Receitas e despesas lançadas",
      run: async () => {
        const rows = await listLancamentosFn({ data: {} });
        downloadCsv(
          "financeiro-consolidado",
          toCsv(rows, [
            { header: "Tipo", value: (r) => r.tipo },
            { header: "Categoria", value: (r) => r.categoria ?? "" },
            { header: "Descrição", value: (r) => r.descricao },
            { header: "Valor (R$)", value: (r) => csvMoney(r.valor_cents) },
            { header: "Status", value: (r) => r.status },
            { header: "Data", value: (r) => csvDate(r.data) },
          ]),
        );
      },
    },
    {
      nome: "Clientes",
      desc: "Cadastro completo de clientes",
      run: async () => {
        const rows = await listClientesFn();
        downloadCsv(
          "clientes",
          toCsv(rows, [
            { header: "Nome", value: (r) => r.nome },
            { header: "E-mail", value: (r) => r.email ?? "" },
            { header: "Telefone", value: (r) => r.telefone ?? "" },
            { header: "Documento", value: (r) => r.documento ?? "" },
            { header: "Cadastrado em", value: (r) => csvDate(r.created_at) },
          ]),
        );
      },
    },
    { nome: "Estoque e curva ABC", desc: "Posição, giro e produtos parados" },
    { nome: "Marketing e ROAS", desc: "Investimento e retorno por canal" },
    { nome: "Funis de venda", desc: "Conversão por etapa e origem" },
  ];

  return (
    <>
      <PageHeader title="Relatórios" description="Exportações em CSV a partir dos seus dados reais" />
      <SectionCard>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {relatorios.map((r) => (
            <div key={r.nome} className="rounded-lg border border-border bg-background p-4">
              <div className="text-sm font-medium">{r.nome}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.desc}</div>
              <div className="mt-3 flex gap-2">
                {r.run ? (
                  <button
                    disabled={loading === r.nome}
                    onClick={() => exportar(r.nome, r.run!)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs hover:border-primary/40 disabled:opacity-50"
                  >
                    {loading === r.nome ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    CSV
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      toast.message(`"${r.nome}" ainda não está pronto`, {
                        description: "Esse relatório está em desenvolvimento e chega em breve.",
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    Em breve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
