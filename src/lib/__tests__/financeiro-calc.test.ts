import { describe, expect, it } from "vitest";
import {
  margemPct,
  roas,
  saldo,
  ticketMedio,
  totalDespesas,
  totalPendente,
  totalReceitas,
  type Lancamento,
} from "@/lib/financeiro-calc";

const rows: Lancamento[] = [
  { tipo: "receita", valor_cents: 100000, status: "pago", data: "2026-07-01" },
  { tipo: "receita", valor_cents: 50000, status: "pendente", data: "2026-07-10" },
  { tipo: "despesa", valor_cents: 30000, status: "pago", data: "2026-07-05" },
  { tipo: "despesa", valor_cents: 20000, status: "atrasado", data: "2026-07-08" },
  { tipo: "receita", valor_cents: 999999, status: "cancelado", data: "2026-07-09" },
];

describe("financeiro", () => {
  it("ignora lançamentos cancelados nas receitas e despesas", () => {
    expect(totalReceitas(rows)).toBe(150000);
    expect(totalDespesas(rows)).toBe(50000);
  });

  it("calcula saldo como receitas menos despesas", () => {
    expect(saldo(rows)).toBe(100000);
  });

  it("calcula o saldo pendente considerando sinal de receita/despesa", () => {
    expect(totalPendente(rows)).toBe(50000 - 20000);
  });

  it("calcula margem percentual e protege divisão por zero", () => {
    expect(margemPct(200000, 50000)).toBeCloseTo(75);
    expect(margemPct(0, 1000)).toBe(0);
  });

  it("calcula ticket médio arredondado em centavos", () => {
    expect(ticketMedio(100000, 3)).toBe(33333);
    expect(ticketMedio(100000, 0)).toBe(0);
  });

  it("calcula ROAS e protege gasto zero", () => {
    expect(roas(400000, 100000)).toBe(4);
    expect(roas(400000, 0)).toBe(0);
  });
});
