import { describe, expect, it } from "vitest";
import { clienteSchema } from "@/lib/clientes.functions";
import { productSchema } from "@/lib/products.functions";

describe("clienteSchema", () => {
  it("aceita um cliente válido mínimo (só nome)", () => {
    const result = clienteSchema.safeParse({ nome: "João Silva" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome vazio", () => {
    const result = clienteSchema.safeParse({ nome: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail em formato inválido", () => {
    const result = clienteSchema.safeParse({ nome: "Ana", email: "não-é-email" });
    expect(result.success).toBe(false);
  });

  it("aceita e-mail vazio ou ausente sem quebrar", () => {
    expect(clienteSchema.safeParse({ nome: "Ana", email: "" }).success).toBe(true);
    expect(clienteSchema.safeParse({ nome: "Ana" }).success).toBe(true);
  });

  it("aceita e-mail válido", () => {
    const result = clienteSchema.safeParse({ nome: "Ana", email: "ana@empresa.com" });
    expect(result.success).toBe(true);
  });

  it("rejeita nome maior que o limite (defesa contra payload gigante)", () => {
    const result = clienteSchema.safeParse({ nome: "a".repeat(500) });
    expect(result.success).toBe(false);
  });

  it("rejeita campo extra de tipo errado tentando forçar tags", () => {
    const result = clienteSchema.safeParse({ nome: "Ana", tags: "não é array" });
    expect(result.success).toBe(false);
  });
});

describe("productSchema", () => {
  const base = {
    sku: "CAM-001",
    name: "Camisa Linho",
    cost_cents: 5000,
    price_cents: 9900,
    stock_qty: 10,
    min_stock: 2,
  };

  it("aceita um produto válido mínimo", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita SKU vazio", () => {
    expect(productSchema.safeParse({ ...base, sku: "" }).success).toBe(false);
  });

  it("rejeita preço negativo (tentativa de fraude/erro)", () => {
    expect(productSchema.safeParse({ ...base, price_cents: -100 }).success).toBe(false);
  });

  it("rejeita custo negativo", () => {
    expect(productSchema.safeParse({ ...base, cost_cents: -1 }).success).toBe(false);
  });

  it("rejeita preço/custo quebrado (não inteiro — centavos fracionados)", () => {
    expect(productSchema.safeParse({ ...base, price_cents: 99.9 }).success).toBe(false);
  });

  it("rejeita estoque negativo", () => {
    expect(productSchema.safeParse({ ...base, stock_qty: -5 }).success).toBe(false);
  });

  it("rejeita category_id que não é um UUID válido", () => {
    expect(productSchema.safeParse({ ...base, category_id: "não-é-uuid" }).success).toBe(false);
  });

  it("aceita category_id/supplier_id ausentes (opcionais)", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });
});
