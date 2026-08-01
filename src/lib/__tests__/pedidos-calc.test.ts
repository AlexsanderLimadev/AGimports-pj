import { describe, expect, it } from "vitest";
import { resolveItens, subtotalCents, totalCents } from "@/lib/pedidos-calc";

const priceMap = new Map([
  ["11111111-1111-1111-1111-111111111111", { price_cents: 19900, name: "Camisa Linho", sku: "CAM-01" }],
  ["22222222-2222-2222-2222-222222222222", { price_cents: 5000, name: "Meia", sku: "MEI-01" }],
]);

describe("resolveItens", () => {
  it("usa o preço autoritativo do produto e ignora o preço enviado pelo cliente", () => {
    const out = resolveItens(
      [
        {
          product_id: "11111111-1111-1111-1111-111111111111",
          descricao_snapshot: "hack",
          qty: 2,
          unit_price_cents: 1, // tentativa de fraude
        },
      ],
      priceMap,
    );
    expect(out[0].unit_price_cents).toBe(19900);
    expect(out[0].descricao_snapshot).toBe("CAM-01 · Camisa Linho");
  });

  it("aceita preço informado apenas em item avulso (sem product_id)", () => {
    const out = resolveItens(
      [{ product_id: null, descricao_snapshot: "Frete", qty: 1, unit_price_cents: 2500 }],
      priceMap,
    );
    expect(out[0].unit_price_cents).toBe(2500);
    expect(out[0].product_id).toBeNull();
  });

  it("rejeita product_id inexistente ou sem acesso", () => {
    expect(() =>
      resolveItens(
        [
          {
            product_id: "33333333-3333-3333-3333-333333333333",
            descricao_snapshot: "x",
            qty: 1,
            unit_price_cents: 100,
          },
        ],
        priceMap,
      ),
    ).toThrow(/inválido ou sem acesso/);
  });
});

describe("totais", () => {
  it("calcula subtotal por item", () => {
    expect(subtotalCents({ qty: 3, unit_price_cents: 1999 })).toBe(5997);
  });

  it("soma o total do pedido em centavos, sem float", () => {
    const itens = resolveItens(
      [
        { product_id: "11111111-1111-1111-1111-111111111111", descricao_snapshot: "", qty: 2, unit_price_cents: 0 },
        { product_id: "22222222-2222-2222-2222-222222222222", descricao_snapshot: "", qty: 3, unit_price_cents: 0 },
        { product_id: null, descricao_snapshot: "Frete", qty: 1, unit_price_cents: 1550 },
      ],
      priceMap,
    );
    expect(totalCents(itens)).toBe(2 * 19900 + 3 * 5000 + 1550);
  });

  it("total de pedido vazio é zero", () => {
    expect(totalCents([])).toBe(0);
  });
});
