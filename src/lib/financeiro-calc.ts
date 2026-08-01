/** Cálculos financeiros puros — isolados para testes automatizados. */

export type Lancamento = {
  tipo: "receita" | "despesa";
  valor_cents: number;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data: string;
};

const active = (l: Lancamento) => l.status !== "cancelado";

export function totalReceitas(rows: Lancamento[]): number {
  return rows.filter((l) => active(l) && l.tipo === "receita").reduce((a, l) => a + l.valor_cents, 0);
}

export function totalDespesas(rows: Lancamento[]): number {
  return rows.filter((l) => active(l) && l.tipo === "despesa").reduce((a, l) => a + l.valor_cents, 0);
}

export function saldo(rows: Lancamento[]): number {
  return totalReceitas(rows) - totalDespesas(rows);
}

export function totalPendente(rows: Lancamento[]): number {
  return rows
    .filter((l) => l.status === "pendente" || l.status === "atrasado")
    .reduce((a, l) => a + (l.tipo === "receita" ? l.valor_cents : -l.valor_cents), 0);
}

export function margemPct(receitas: number, despesas: number): number {
  if (receitas <= 0) return 0;
  return ((receitas - despesas) / receitas) * 100;
}

export function ticketMedio(receitaTotalCents: number, pedidos: number): number {
  if (pedidos <= 0) return 0;
  return Math.round(receitaTotalCents / pedidos);
}

export function roas(receitaCents: number, gastoCents: number): number {
  if (gastoCents <= 0) return 0;
  return receitaCents / gastoCents;
}
