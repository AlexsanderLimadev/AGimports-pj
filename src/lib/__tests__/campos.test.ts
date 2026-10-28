import { describe, expect, it } from "vitest";
import { clienteSchema } from "@/lib/clientes.functions";
import { productSchema } from "@/lib/products.functions";
import { errosPorCampo } from "@/lib/campos";

describe("errosPorCampo", () => {
  it("formulário certo não tem erro", () => {
    expect(errosPorCampo(clienteSchema, { nome: "Ana", tags: [] })).toEqual({});
  });
  it("nome vazio pede o campo", () => {
    expect(errosPorCampo(clienteSchema, { nome: "   ", tags: [] }).nome).toBe("Campo obrigatório");
  });
  it("e-mail inválido avisa no campo do e-mail", () => {
    expect(errosPorCampo(clienteSchema, { nome: "Ana", email: "ana@", tags: [] }).email).toBe("E-mail inválido");
  });
  it("e-mail vazio é aceito", () => {
    expect(errosPorCampo(clienteSchema, { nome: "Ana", email: "", tags: [] })).toEqual({});
  });
  it("texto longo demais mostra o limite", () => {
    expect(errosPorCampo(clienteSchema, { nome: "a".repeat(201), tags: [] }).nome).toBe("Use no máximo 200 caracteres");
  });
  it("valor negativo no produto diz que não pode", () => {
    const base = { sku: "A1", name: "X", cost_cents: 0, price_cents: -5, stock_qty: 0, min_stock: 0, active: true };
    expect(errosPorCampo(productSchema, base).price_cents).toBe("Não pode ser negativo");
  });
  it("número que não é número pede um número", () => {
    const base = { sku: "A1", name: "X", cost_cents: NaN, price_cents: 0, stock_qty: 0, min_stock: 0, active: true };
    expect(errosPorCampo(productSchema, base).cost_cents).toBe("Informe um número");
  });
  it("URL de imagem inválida avisa", () => {
    const base = { sku: "A1", name: "X", cost_cents: 0, price_cents: 0, stock_qty: 0, min_stock: 0, image_url: "foto", active: true };
    expect(errosPorCampo(productSchema, base).image_url).toMatch(/Endereço inválido/);
  });
  it("junta vários erros, um por campo", () => {
    const r = errosPorCampo(clienteSchema, { nome: "", email: "x", tags: [] });
    expect(Object.keys(r).sort()).toEqual(["email", "nome"]);
  });
  it("nenhuma mensagem tem travessão", () => {
    const r = errosPorCampo(productSchema, { sku: "", name: "", cost_cents: -1, price_cents: -1, stock_qty: -1, min_stock: -1, image_url: "x" });
    for (const m of Object.values(r)) expect(m).not.toMatch(/—|–/);
  });

  it("link do produto: aceita http(s), aceita vazio e recusa javascript:", () => {
    const base = { sku: "A1", name: "X", cost_cents: 0, price_cents: 0, stock_qty: 0, min_stock: 0, active: true };
    expect(errosPorCampo(productSchema, { ...base, link_url: "https://loja.com/p/1" })).toEqual({});
    expect(errosPorCampo(productSchema, { ...base, link_url: "www.loja.com/p" })).toEqual({});
    expect(errosPorCampo(productSchema, { ...base, link_url: "" })).toEqual({});
    expect(errosPorCampo(productSchema, { ...base, link_url: null })).toEqual({});
    expect(errosPorCampo(productSchema, { ...base, link_url: "javascript:alert(1)" }).link_url).toMatch(/http/);
    expect(errosPorCampo(productSchema, { ...base, link_url: "comprar aqui" }).link_url).toBeTruthy();
  });
});
