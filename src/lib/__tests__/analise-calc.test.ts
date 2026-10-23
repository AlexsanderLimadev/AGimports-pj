import { describe, expect, it } from "vitest";
import { calcularAnalise } from "@/lib/analise-calc";
import { gerarInsights } from "@/lib/insights";

const AGORA = new Date("2026-10-15T12:00:00Z");

const produtos = [
  { id: "a", name: "Camisa", price_cents: 10000, cost_cents: 5000 },
  { id: "b", name: "Meia", price_cents: 2000, cost_cents: 1000 },
  { id: "c", name: "Boné", price_cents: 8000, cost_cents: 0 },
];

describe("calcularAnalise", () => {
  it("sem dados: tudo nulo ou zero, nada inventado", () => {
    const r = calcularAnalise([], [], [], AGORA);
    expect(r.totalPedidos).toBe(0);
    expect(r.mesVariacaoPct).toBeNull();
    expect(r.roiPct).toBeNull();
    expect(r.maisVendido).toBeNull();
    expect(r.menosVendido).toBeNull();
    expect(r.maisBarato).toBeNull();
    expect(r.totalVendedores).toBe(0);
  });

  it("acha produto mais barato e mais caro ignorando preço zero", () => {
    const r = calcularAnalise([...produtos, { id: "z", name: "Brinde", price_cents: 0, cost_cents: 0 }], [], [], AGORA);
    expect(r.maisBarato?.nome).toBe("Meia");
    expect(r.maisCaro?.nome).toBe("Camisa");
  });

  it("faturamento do mês e variação contra o mês anterior", () => {
    const pedidos = [
      { id: "p1", total_cents: 30000, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null },
      { id: "p2", total_cents: 20000, created_at: "2026-09-10T10:00:00Z", vendedor_nome: null },
    ];
    const r = calcularAnalise([], pedidos, [], AGORA);
    expect(r.mesAtualCents).toBe(30000);
    expect(r.mesAnteriorCents).toBe(20000);
    expect(r.mesVariacaoPct).toBeCloseTo(50);
  });

  it("variação é nula quando o período anterior é zero", () => {
    const pedidos = [{ id: "p1", total_cents: 100, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null }];
    expect(calcularAnalise([], pedidos, [], AGORA).mesVariacaoPct).toBeNull();
  });

  it("em janeiro compara com dezembro do ano anterior", () => {
    const pedidos = [
      { id: "p1", total_cents: 200, created_at: "2026-01-05T10:00:00Z", vendedor_nome: null },
      { id: "p2", total_cents: 100, created_at: "2025-12-20T10:00:00Z", vendedor_nome: null },
    ];
    const r = calcularAnalise([], pedidos, [], new Date("2026-01-20T12:00:00Z"));
    expect(r.mesAnteriorCents).toBe(100);
    expect(r.mesVariacaoPct).toBeCloseTo(100);
    expect(r.anoAnteriorCents).toBe(100);
  });

  it("mais e menos vendido, ROI só com itens de produto com custo, e produto sem venda", () => {
    const pedidos = [
      { id: "p1", total_cents: 0, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null },
    ];
    const itens = [
      { pedido_id: "p1", product_id: "a", descricao_snapshot: "Camisa", qty: 3, subtotal_cents: 30000 },
      { pedido_id: "p1", product_id: "b", descricao_snapshot: "Meia", qty: 1, subtotal_cents: 2000 },
    ];
    const r = calcularAnalise(produtos, pedidos, itens, AGORA);
    expect(r.maisVendido?.nome).toBe("Camisa");
    expect(r.maisVendido?.qtd).toBe(3);
    expect(r.menosVendido?.nome).toBe("Meia");
    // receita 32000, custo 3*5000 + 1*1000 = 16000 -> ROI 100%
    expect(r.roiPct).toBeCloseTo(100);
    expect(r.produtosSemVenda.map((p) => p.nome)).toEqual(["Boné"]);
  });

  it("menos vendido é nulo com apenas um produto vendido", () => {
    const pedidos = [{ id: "p1", total_cents: 0, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null }];
    const itens = [{ pedido_id: "p1", product_id: "a", descricao_snapshot: "Camisa", qty: 1, subtotal_cents: 10000 }];
    const r = calcularAnalise(produtos, pedidos, itens, AGORA);
    expect(r.maisVendido?.nome).toBe("Camisa");
    expect(r.menosVendido).toBeNull();
  });

  it("ignora itens de pedidos que não estão na lista (cancelados)", () => {
    const itens = [{ pedido_id: "cancelado", product_id: "a", descricao_snapshot: "Camisa", qty: 9, subtotal_cents: 90000 }];
    expect(calcularAnalise(produtos, [], itens, AGORA).maisVendido).toBeNull();
  });

  it("ROI é nulo quando nenhum produto vendido tem custo", () => {
    const pedidos = [{ id: "p1", total_cents: 0, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null }];
    const itens = [{ pedido_id: "p1", product_id: "c", descricao_snapshot: "Boné", qty: 2, subtotal_cents: 16000 }];
    expect(calcularAnalise(produtos, pedidos, itens, AGORA).roiPct).toBeNull();
  });

  it("ranking de vendedores ordena por total e ignora pedido sem vendedor", () => {
    const pedidos = [
      { id: "1", total_cents: 1000, created_at: "2026-10-01T10:00:00Z", vendedor_nome: "Ana" },
      { id: "2", total_cents: 5000, created_at: "2026-10-02T10:00:00Z", vendedor_nome: "Bia" },
      { id: "3", total_cents: 2000, created_at: "2026-10-03T10:00:00Z", vendedor_nome: "Ana" },
      { id: "4", total_cents: 9999, created_at: "2026-10-04T10:00:00Z", vendedor_nome: null },
    ];
    const r = calcularAnalise([], pedidos, [], AGORA);
    expect(r.ranking.map((v) => v.nome)).toEqual(["Bia", "Ana"]);
    expect(r.vendedorTop?.totalCents).toBe(5000);
    expect(r.vendedorBottom?.nome).toBe("Ana");
    expect(r.vendedorBottom?.pedidos).toBe(2);
  });

  it("vendedor bottom é nulo com um só vendedor", () => {
    const pedidos = [{ id: "1", total_cents: 1000, created_at: "2026-10-01T10:00:00Z", vendedor_nome: "Ana" }];
    expect(calcularAnalise([], pedidos, [], AGORA).vendedorBottom).toBeNull();
  });
});

describe("gerarInsights", () => {
  it("sem dados não gera nenhum insight", () => {
    expect(gerarInsights(calcularAnalise([], [], [], AGORA))).toEqual([]);
  });

  it("alerta de queda de faturamento a partir de -10%", () => {
    const pedidos = [
      { id: "1", total_cents: 8000, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null },
      { id: "2", total_cents: 10000, created_at: "2026-09-05T10:00:00Z", vendedor_nome: null },
    ];
    const ins = gerarInsights(calcularAnalise([], pedidos, [], AGORA));
    expect(ins.some((i) => i.tipo === "alerta" && i.texto.includes("caiu"))).toBe(true);
  });

  it("não alerta com variação pequena", () => {
    const pedidos = [
      { id: "1", total_cents: 10500, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null },
      { id: "2", total_cents: 10000, created_at: "2026-09-05T10:00:00Z", vendedor_nome: null },
    ];
    expect(gerarInsights(calcularAnalise([], pedidos, [], AGORA))).toEqual([]);
  });

  it("avisa dependência quando um produto passa de 40% da receita", () => {
    const pedidos = [{ id: "1", total_cents: 10000, created_at: "2026-10-05T10:00:00Z", vendedor_nome: null }];
    const itens = [
      { pedido_id: "1", product_id: "a", descricao_snapshot: "Camisa", qty: 1, subtotal_cents: 9000 },
      { pedido_id: "1", product_id: "b", descricao_snapshot: "Meia", qty: 1, subtotal_cents: 1000 },
    ];
    const ins = gerarInsights(calcularAnalise(produtos, pedidos, itens, AGORA));
    expect(ins.some((i) => i.texto.includes("Dependência"))).toBe(true);
  });

  it("nenhum texto gerado contém travessão", () => {
    const pedidos = [
      { id: "1", total_cents: 8000, created_at: "2026-10-05T10:00:00Z", vendedor_nome: "Ana" },
      { id: "2", total_cents: 100, created_at: "2026-10-06T10:00:00Z", vendedor_nome: "Bia" },
      { id: "3", total_cents: 10000, created_at: "2026-09-05T10:00:00Z", vendedor_nome: null },
    ];
    const itens = [
      { pedido_id: "1", product_id: "a", descricao_snapshot: "Camisa", qty: 1, subtotal_cents: 8000 },
      { pedido_id: "2", product_id: "b", descricao_snapshot: "Meia", qty: 1, subtotal_cents: 100 },
    ];
    for (const i of gerarInsights(calcularAnalise(produtos, pedidos, itens, AGORA))) {
      expect(i.texto).not.toContain("—");
    }
  });
});
