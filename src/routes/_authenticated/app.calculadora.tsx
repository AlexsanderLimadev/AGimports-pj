import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { brl, pct } from "@/lib/mock/data";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCalculo,
  listCalculos,
  saveCalculo,
} from "@/lib/calculadora.functions";

export const Route = createFileRoute("/_authenticated/app/calculadora")({
  head: () => ({ meta: [{ title: "Calculadora · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(historicoOptions),
  component: Calc,
});

type Inputs = {
  fornecedor: number;
  freteInt: number;
  freteNac: number;
  seguro: number;
  impostosImp: number;
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
  txCartao: number;
  txMarketplace: number;
  comissao: number;
  embalagem: number;
  marketing: number;
  operacional: number;
  margem: number;
  quantidade: number;
  desconto: number;
};

const initial: Inputs = {
  fornecedor: 120,
  freteInt: 28,
  freteNac: 22,
  seguro: 4,
  impostosImp: 18,
  icms: 12,
  ipi: 4,
  pis: 1.65,
  cofins: 7.6,
  txCartao: 3.99,
  txMarketplace: 12,
  comissao: 3,
  embalagem: 6,
  marketing: 15,
  operacional: 8,
  margem: 45,
  quantidade: 50,
  desconto: 0,
};

function Field({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix?: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1 flex h-9 items-center rounded-md border border-border bg-background focus-within:border-primary/50">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="tabular h-full flex-1 bg-transparent px-2.5 text-sm focus:outline-none"
        />
        {suffix && <span className="pr-2.5 text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

type Historico = {
  id: string;
  nome: string | null;
  custo_cents: number;
  preco_final_cents: number;
  margem_pct: number;
  created_at: string;
};

const historicoOptions = queryOptions({
  queryKey: ["calculo-historico"],
  queryFn: () => listCalculos() as Promise<Historico[]>,
});

function Calc() {
  const { data: historico } = useSuspenseQuery(historicoOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["calculo-historico"] });

  const [i, setI] = useState<Inputs>(initial);
  const [nome, setNome] = useState("");
  const set = <K extends keyof Inputs>(k: K) => (v: number) => setI((s) => ({ ...s, [k]: v }));

  const save = useMutation({
    mutationFn: (payload: { nome: string | null; custo_cents: number; frete_cents: number; impostos_pct: number; margem_pct: number; preco_final_cents: number; params: Record<string, unknown> }) =>
      saveCalculo({ data: payload }),
    onSuccess: () => {
      toast.success("Cenário salvo");
      setNome("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCalculo({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const r = useMemo(() => {
    const custoDireto =
      i.fornecedor + i.freteInt + i.freteNac + i.seguro + i.embalagem + i.operacional;
    const custoImportacao = custoDireto * (1 + i.impostosImp / 100);
    const impostosPct = (i.icms + i.ipi + i.pis + i.cofins) / 100;
    const taxasPct = (i.txCartao + i.txMarketplace + i.comissao + i.marketing) / 100;
    const margemPct = i.margem / 100;
    const denom = 1 - impostosPct - taxasPct - margemPct;
    const preco = denom > 0 ? custoImportacao / denom : custoImportacao * 4;
    const lucroUnit = preco * margemPct;
    const markup = ((preco - custoImportacao) / custoImportacao) * 100;
    const custosFixos = preco * (impostosPct + taxasPct);
    const breakeven = custoImportacao + custosFixos;
    const precoAtacado = preco * 0.78;
    const precoVarejo = preco;
    const precoPromo = preco * (1 - i.desconto / 100);
    const precoMin = custoImportacao / (1 - impostosPct - taxasPct - 0.1);
    const lucroTotal = lucroUnit * i.quantidade;
    const roi = (lucroTotal / (custoImportacao * i.quantidade)) * 100;
    return {
      custoImportacao,
      preco,
      lucroUnit,
      lucroTotal,
      markup,
      breakeven,
      precoAtacado,
      precoVarejo,
      precoPromo,
      precoMin,
      roi,
    };
  }, [i]);

  const kpi = (label: string, value: string, tone?: "pos" | "neg") => (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={`tabular mt-0.5 text-lg font-semibold ${
          tone === "pos" ? "text-primary" : tone === "neg" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Calculadora inteligente"
        description="Precificação completa para varejo e atacado de importados"
        actions={
          <div className="flex items-center gap-2">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do cenário"
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs focus:border-primary/50 focus:outline-none"
            />
            <button
              onClick={() =>
                save.mutate({
                  nome: nome.trim() || null,
                  custo_cents: Math.round(r.custoImportacao * 100),
                  frete_cents: Math.round((i.freteInt + i.freteNac) * 100),
                  impostos_pct: i.impostosImp + i.icms + i.ipi + i.pis + i.cofins,
                  margem_pct: i.margem,
                  preco_final_cents: Math.round(r.preco * 100),
                  params: i as unknown as Record<string, unknown>,
                })
              }
              disabled={save.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Salvar cenário
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard title="Entradas" description="Todos os custos, impostos e taxas">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Preço fornecedor" suffix="R$" value={i.fornecedor} onChange={set("fornecedor")} />
              <Field label="Frete internacional" suffix="R$" value={i.freteInt} onChange={set("freteInt")} />
              <Field label="Frete nacional" suffix="R$" value={i.freteNac} onChange={set("freteNac")} />
              <Field label="Seguro" suffix="R$" value={i.seguro} onChange={set("seguro")} />
              <Field label="Embalagem" suffix="R$" value={i.embalagem} onChange={set("embalagem")} />
              <Field label="Operacional" suffix="R$" value={i.operacional} onChange={set("operacional")} />
              <Field label="Impostos importação" suffix="%" value={i.impostosImp} onChange={set("impostosImp")} />
              <Field label="ICMS" suffix="%" value={i.icms} onChange={set("icms")} />
              <Field label="IPI" suffix="%" value={i.ipi} onChange={set("ipi")} />
              <Field label="PIS" suffix="%" value={i.pis} onChange={set("pis")} />
              <Field label="COFINS" suffix="%" value={i.cofins} onChange={set("cofins")} />
              <Field label="Taxa cartão" suffix="%" value={i.txCartao} onChange={set("txCartao")} />
              <Field label="Taxa marketplace" suffix="%" value={i.txMarketplace} onChange={set("txMarketplace")} />
              <Field label="Comissão" suffix="%" value={i.comissao} onChange={set("comissao")} />
              <Field label="Marketing" suffix="%" value={i.marketing} onChange={set("marketing")} />
              <Field label="Margem desejada" suffix="%" value={i.margem} onChange={set("margem")} />
              <Field label="Quantidade" value={i.quantidade} onChange={set("quantidade")} />
              <Field label="Desconto promo" suffix="%" value={i.desconto} onChange={set("desconto")} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Resultados" description="Atualizados em tempo real">
            <div className="grid grid-cols-2 gap-3">
              {kpi("Custo final", brl(r.custoImportacao))}
              {kpi("Preço ideal", brl(r.preco), "pos")}
              {kpi("Lucro por unidade", brl(r.lucroUnit), "pos")}
              {kpi("Lucro total", brl(r.lucroTotal), "pos")}
              {kpi("Markup", pct(r.markup))}
              {kpi("ROI", pct(r.roi))}
              {kpi("Break-even", brl(r.breakeven))}
              {kpi("Preço mínimo", brl(r.precoMin), "neg")}
            </div>
          </SectionCard>

          <SectionCard title="Cenários de venda">
            <div className="space-y-2">
              {[
                ["Varejo (recomendado)", r.precoVarejo, "primary"],
                ["Atacado (-22%)", r.precoAtacado, "chart-2"],
                ["Promocional", r.precoPromo, "warning"],
                ["Preço mínimo", r.precoMin, "destructive"],
              ].map(([label, val]) => (
                <div
                  key={label as string}
                  className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
                >
                  <span className="text-sm">{label as string}</span>
                  <span className="tabular text-sm font-semibold">{brl(val as number)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Histórico de cenários" className="mt-4">
        {historico.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum cenário salvo ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {historico.map((h) => (
              <div key={h.id} className="group flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{h.nome ?? "Sem nome"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(h.created_at).toLocaleString("pt-BR")} · custo {brl(h.custo_cents / 100)} · margem {pct(h.margem_pct)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-sm font-semibold">{brl(h.preco_final_cents / 100)}</span>
                  <button
                    onClick={() => remove.mutate(h.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
