import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle, UserCheck } from "lucide-react";
import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { getClientesCompradores } from "@/lib/clientes-sumidos.functions";
import { DIAS_OPCOES, DIAS_PADRAO, filtrarSumidos, linkWhatsApp } from "@/lib/clientes-sumidos-calc";
import { brl } from "@/lib/mock/data";

const opcoes = queryOptions({
  queryKey: ["clientes-sumidos"],
  queryFn: () => getClientesCompradores(),
});

export const Route = createFileRoute("/_authenticated/app/clientes-sumidos")({
  head: () => ({ meta: [{ title: "Clientes que sumiram · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opcoes),
  component: ClientesSumidos,
});

const cents = (v: number) => brl(v / 100);

function ClientesSumidos() {
  const { data } = useSuspenseQuery(opcoes);
  const [dias, setDias] = useState<number>(DIAS_PADRAO);
  const sumidos = useMemo(() => filtrarSumidos(data.compradores, new Date(), dias), [data, dias]);
  const valorHistorico = sumidos.reduce((s, c) => s + c.totalGastoCents, 0);

  return (
    <>
      <PageHeader
        title="Clientes que sumiram"
        description="Quem já comprou de você e parou. Voltar a vender para quem já conhece você é o caminho mais barato"
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Sumidos" value={String(sumidos.length)} hint={`${dias} dias ou mais sem comprar`} tone={sumidos.length ? "warning" : "neutral"} />
        <KpiCard label="Já gastaram" value={cents(valorHistorico)} hint="Total comprado por eles até hoje" />
        <KpiCard label="Clientes que compraram" value={String(data.compradores.length)} hint="Com pelo menos 1 pedido" />
        <KpiCard label="Nunca compraram" value={String(data.semCompra)} hint="Cadastrados sem nenhum pedido" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Tempo sem comprar">
        <span className="text-sm text-muted-foreground">Sem comprar há</span>
        {DIAS_OPCOES.map((d) => (
          <Button key={d} size="sm" variant={d === dias ? "default" : "outline"} onClick={() => setDias(d)}>
            {d} dias
          </Button>
        ))}
      </div>

      <SectionCard title="Quem chamar primeiro" description="Ordenados por quanto já gastaram com você">
        {sumidos.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="h-4 w-4" />}
            title={data.compradores.length === 0 ? "Ainda não há clientes com pedido" : "Ninguém sumido nesse prazo"}
            description={
              data.compradores.length === 0
                ? "Quando você vincular pedidos a clientes, eles aparecem aqui."
                : "Todos que já compraram voltaram dentro desse prazo. Teste um prazo menor."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {sumidos.map((c) => {
              const link = linkWhatsApp(c);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.diasSemComprar} dias sem comprar · {c.totalPedidos} {c.totalPedidos === 1 ? "pedido" : "pedidos"} · ticket {cents(c.ticketMedioCents)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular hidden text-right font-medium sm:block">{cents(c.totalGastoCents)}</span>
                    {link ? (
                      <Button asChild size="sm" variant="outline">
                        <a href={link} target="_blank" rel="noreferrer" aria-label={`Chamar ${c.nome} no WhatsApp`}>
                          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                          WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">sem telefone válido</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
