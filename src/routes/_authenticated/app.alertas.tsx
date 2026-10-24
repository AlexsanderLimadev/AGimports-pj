import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BellRing, PackageCheck } from "lucide-react";
import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { getAlertasNegocio } from "@/lib/alertas.functions";
import { brl } from "@/lib/mock/data";

const alertasOptions = queryOptions({
  queryKey: ["alertas-negocio"],
  queryFn: () => getAlertasNegocio(),
});

export const Route = createFileRoute("/_authenticated/app/alertas")({
  head: () => ({ meta: [{ title: "Alertas de Negócio · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(alertasOptions),
  component: Alertas,
});

const cents = (v: number) => brl(v / 100);

function Linha({ children }: { children: React.ReactNode }) {
  return <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">{children}</li>;
}

function Alertas() {
  const { data: a } = useSuspenseQuery(alertasOptions);

  return (
    <>
      <PageHeader
        title="Alertas de Negócio"
        description="O que precisa da sua atenção agora, calculado só com dado real do seu cadastro"
      />

      {a.total === 0 && (
        <SectionCard className="mb-4">
          <EmptyState
            icon={<PackageCheck className="h-4 w-4" />}
            title="Nenhum alerta no momento"
            description="Margens saudáveis, estoque girando e nada para repor. Preencha o custo dos produtos para ativar o alerta de margem."
          />
        </SectionCard>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Margem baixa" value={String(a.margemBaixa.length)} hint={`Abaixo de ${a.margemMinimaPct}%`} tone={a.margemBaixa.length ? "warning" : "neutral"} />
        <KpiCard label="Estoque parado" value={String(a.estoqueParado.length)} hint={`Sem venda há ${a.diasParado} dias ou mais`} tone={a.estoqueParado.length ? "warning" : "neutral"} />
        <KpiCard label="Dinheiro parado" value={cents(a.capitalParadoTotalCents)} hint="Custo x quantidade em estoque" />
        <KpiCard label="Para repor" value={String(a.reposicao.length)} hint="No mínimo ou abaixo" tone={a.reposicao.length ? "destructive" : "neutral"} />
      </div>

      {a.margemBaixa.length > 0 && (
        <SectionCard title="Margem baixa" description={`Produtos ativos com margem abaixo de ${a.margemMinimaPct}% sobre o preço de venda`} className="mb-4">
          <ul className="divide-y divide-border">
            {a.margemBaixa.map((p) => (
              <Linha key={p.id}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground">{p.sku}</span>
                </span>
                <span className="tabular shrink-0 text-right">
                  <span className="block font-medium">{p.margemPct.toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground">
                    custo {cents(p.costCents)} · preço {cents(p.priceCents)}
                  </span>
                </span>
              </Linha>
            ))}
          </ul>
        </SectionCard>
      )}

      {a.estoqueParado.length > 0 && (
        <SectionCard title="Estoque parado" description="Produtos com estoque que não vendem. Considere promoção ou combo" className="mb-4">
          <ul className="divide-y divide-border">
            {a.estoqueParado.map((p) => (
              <Linha key={p.id}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.sku} · {p.estoque} un. ·{" "}
                    {p.diasSemVenda === null ? "nunca vendeu" : `última venda há ${p.diasSemVenda} dias`}
                  </span>
                </span>
                <span className="tabular shrink-0 text-right font-medium">{cents(p.capitalParadoCents)}</span>
              </Linha>
            ))}
          </ul>
        </SectionCard>
      )}

      {a.reposicao.length > 0 && (
        <SectionCard title="Reposição" description="Produtos que chegaram ao estoque mínimo que você definiu" className="mb-4">
          <ul className="divide-y divide-border">
            {a.reposicao.map((p) => (
              <Linha key={p.id}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground">{p.sku}</span>
                </span>
                <span className="tabular shrink-0 text-right">
                  <span className="font-medium">{p.estoque} un.</span>
                  <span className="ml-2 text-xs text-muted-foreground">mínimo {p.minimo}</span>
                </span>
              </Linha>
            ))}
          </ul>
        </SectionCard>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <BellRing className="h-3.5 w-3.5" />
        Limites atuais: margem mínima de {a.margemMinimaPct}% e {a.diasParado} dias sem venda. Mude em{" "}
        <Link to="/app/configuracoes" className="underline underline-offset-2">Configurações</Link>; custo e estoque mínimo ficam em{" "}
        <Link to="/app/produtos" className="underline underline-offset-2">Produtos</Link>.
      </p>
    </>
  );
}
