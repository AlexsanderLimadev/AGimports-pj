import { describe, expect, it } from "vitest";
import { chaveNome, normalizarNome, resumirPorVendedor } from "@/lib/vendedores-calc";

describe("normalizarNome", () => {
  it("tira espaços das pontas e repetidos", () => {
    expect(normalizarNome("  Maria   Silva ")).toBe("Maria Silva");
  });
  it("texto vazio continua vazio", () => {
    expect(normalizarNome("   ")).toBe("");
  });
});

describe("chaveNome", () => {
  it("João e joao são o mesmo vendedor", () => {
    expect(chaveNome("João")).toBe(chaveNome(" joao "));
  });
  it("nomes diferentes têm chaves diferentes", () => {
    expect(chaveNome("Ana")).not.toBe(chaveNome("Ana Paula"));
  });
});

describe("resumirPorVendedor", () => {
  it("soma pedidos e total por vendedor e ignora pedido sem vendedor", () => {
    const r = resumirPorVendedor([
      { vendedor_id: "a", total_cents: 1000 },
      { vendedor_id: "a", total_cents: 500 },
      { vendedor_id: "b", total_cents: 200 },
      { vendedor_id: null, total_cents: 9999 },
    ]);
    expect(r.get("a")).toEqual({ pedidos: 2, totalCents: 1500 });
    expect(r.get("b")).toEqual({ pedidos: 1, totalCents: 200 });
    expect(r.size).toBe(2);
  });
  it("lista vazia dá resumo vazio", () => {
    expect(resumirPorVendedor([]).size).toBe(0);
  });
});
