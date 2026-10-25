import { describe, expect, it } from "vitest";
import { calcularPassos } from "@/lib/primeiros-passos-calc";

const vazio = { produtos: 0, produtosComCusto: 0, clientes: 0, vendedores: 0, pedidos: 0 };

describe("calcularPassos", () => {
  it("conta vazia: nada feito, próximo é cadastrar produto", () => {
    const r = calcularPassos(vazio);
    expect(r.feitos).toBe(0);
    expect(r.total).toBe(5);
    expect(r.concluido).toBe(false);
    expect(r.proximo?.id).toBe("produto");
  });
  it("produto sem custo: o próximo passo é informar o custo", () => {
    const r = calcularPassos({ ...vazio, produtos: 3 });
    expect(r.passos.find((p) => p.id === "produto")?.feito).toBe(true);
    expect(r.proximo?.id).toBe("custo");
  });
  it("vendedor é opcional: concluído mesmo sem vendedor", () => {
    const r = calcularPassos({ produtos: 2, produtosComCusto: 2, clientes: 1, vendedores: 0, pedidos: 4 });
    expect(r.concluido).toBe(true);
    expect(r.feitos).toBe(4);
    expect(r.proximo?.id).toBe("vendedor");
  });
  it("tudo feito: sem próximo passo", () => {
    const r = calcularPassos({ produtos: 2, produtosComCusto: 1, clientes: 1, vendedores: 1, pedidos: 1 });
    expect(r.concluido).toBe(true);
    expect(r.feitos).toBe(5);
    expect(r.proximo).toBeNull();
  });
  it("falta o pedido: não está concluído", () => {
    const r = calcularPassos({ produtos: 2, produtosComCusto: 2, clientes: 1, vendedores: 1, pedidos: 0 });
    expect(r.concluido).toBe(false);
    expect(r.proximo?.id).toBe("pedido");
  });
});
