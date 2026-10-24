import { describe, expect, it } from "vitest";
import { calcularAlertas, margemPct, type ProdutoAlerta } from "@/lib/alertas-calc";

const AGORA = new Date("2026-10-23T12:00:00Z");
const diasAtras = (n: number) => new Date(AGORA.getTime() - n * 86_400_000).toISOString();

const base = (o: Partial<ProdutoAlerta>): ProdutoAlerta => ({
  id: "x",
  name: "Produto",
  sku: "SKU",
  price_cents: 10000,
  cost_cents: 5000,
  stock_qty: 10,
  min_stock: 0,
  active: true,
  created_at: diasAtras(365),
  ...o,
});

describe("margemPct", () => {
  it("calcula sobre o preço de venda", () => {
    expect(margemPct(10000, 8000)).toBeCloseTo(20);
  });
  it("é nula sem preço ou sem custo (não inventa número)", () => {
    expect(margemPct(0, 5000)).toBeNull();
    expect(margemPct(10000, 0)).toBeNull();
  });
});

describe("margem baixa", () => {
  it("alerta abaixo de 20% e ignora quem está exatamente em 20%", () => {
    const r = calcularAlertas(
      [
        base({ id: "a", cost_cents: 9000 }), // 10%
        base({ id: "b", cost_cents: 8000 }), // 20%
        base({ id: "c", cost_cents: 5000 }), // 50%
      ],
      new Map([["a", diasAtras(1)], ["b", diasAtras(1)], ["c", diasAtras(1)]]),
      AGORA,
    );
    expect(r.margemBaixa.map((p) => p.id)).toEqual(["a"]);
  });
  it("não alerta produto sem custo informado nem produto inativo", () => {
    const r = calcularAlertas(
      [base({ id: "a", cost_cents: 0 }), base({ id: "b", cost_cents: 9900, active: false })],
      new Map(),
      AGORA,
    );
    expect(r.margemBaixa).toEqual([]);
  });
  it("ordena da pior margem para a melhor", () => {
    const r = calcularAlertas(
      [base({ id: "a", cost_cents: 9000 }), base({ id: "b", cost_cents: 9800 })],
      new Map(),
      AGORA,
    );
    expect(r.margemBaixa.map((p) => p.id)).toEqual(["b", "a"]);
  });
  it("respeita margem mínima configurada", () => {
    const r = calcularAlertas([base({ id: "a", cost_cents: 8000 })], new Map(), AGORA, 30);
    expect(r.margemBaixa).toHaveLength(1);
  });
});

describe("estoque parado", () => {
  it("alerta quem vendeu há 60 dias ou mais e soma o capital parado", () => {
    const r = calcularAlertas(
      [base({ id: "a", stock_qty: 4, cost_cents: 2500 })],
      new Map([["a", diasAtras(75)]]),
      AGORA,
    );
    expect(r.estoqueParado).toHaveLength(1);
    expect(r.estoqueParado[0].diasSemVenda).toBe(75);
    expect(r.estoqueParado[0].capitalParadoCents).toBe(10000);
    expect(r.capitalParadoTotalCents).toBe(10000);
  });
  it("não alerta venda recente", () => {
    const r = calcularAlertas([base({ id: "a" })], new Map([["a", diasAtras(59)]]), AGORA);
    expect(r.estoqueParado).toEqual([]);
  });
  it("produto antigo que nunca vendeu é alerta, com dias nulos", () => {
    const r = calcularAlertas([base({ id: "a" })], new Map(), AGORA);
    expect(r.estoqueParado[0].diasSemVenda).toBeNull();
  });
  it("produto novo que ainda não vendeu não é alerta", () => {
    const r = calcularAlertas([base({ id: "a", created_at: diasAtras(10) })], new Map(), AGORA);
    expect(r.estoqueParado).toEqual([]);
  });
  it("sem estoque não há dinheiro parado", () => {
    const r = calcularAlertas([base({ id: "a", stock_qty: 0 })], new Map(), AGORA);
    expect(r.estoqueParado).toEqual([]);
  });
  it("ordena pelo maior dinheiro parado", () => {
    const r = calcularAlertas(
      [base({ id: "a", stock_qty: 1, cost_cents: 100 }), base({ id: "b", stock_qty: 10, cost_cents: 1000 })],
      new Map(),
      AGORA,
    );
    expect(r.estoqueParado.map((p) => p.id)).toEqual(["b", "a"]);
  });
});

describe("reposição", () => {
  it("alerta quando o estoque chega ao mínimo", () => {
    const r = calcularAlertas([base({ id: "a", stock_qty: 3, min_stock: 3 })], new Map([["a", diasAtras(1)]]), AGORA);
    expect(r.reposicao.map((p) => p.id)).toEqual(["a"]);
  });
  it("não alerta se o mínimo não foi configurado (zero)", () => {
    const r = calcularAlertas([base({ id: "a", stock_qty: 0, min_stock: 0 })], new Map(), AGORA);
    expect(r.reposicao).toEqual([]);
  });
  it("não alerta com estoque acima do mínimo", () => {
    const r = calcularAlertas([base({ id: "a", stock_qty: 5, min_stock: 3 })], new Map([["a", diasAtras(1)]]), AGORA);
    expect(r.reposicao).toEqual([]);
  });
});

describe("total", () => {
  it("sem produtos não há nenhum alerta", () => {
    const r = calcularAlertas([], new Map(), AGORA);
    expect(r.total).toBe(0);
  });
});
