import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { erroAppSchema } from "@/lib/erros-app.functions";
import { gerarCodigoErro, interpretarErro } from "@/lib/erros-calc";

const base = { codigo: "A7K2", tipo: "generico", tela: "/app/produtos", mensagem: "Algo deu errado." };

describe("erroAppSchema", () => {
  it("aceita um registro normal", () => {
    expect(erroAppSchema.safeParse(base).success).toBe(true);
  });
  it("todo código que o tradutor gera passa na validação", () => {
    for (let i = 0; i < 300; i++) {
      expect(erroAppSchema.safeParse({ ...base, codigo: gerarCodigoErro() }).success).toBe(true);
    }
  });
  it("rejeita código fora do padrão, tipo desconhecido e textos longos demais", () => {
    expect(erroAppSchema.safeParse({ ...base, codigo: "a7k2" }).success).toBe(false);
    expect(erroAppSchema.safeParse({ ...base, codigo: "A" }).success).toBe(false);
    expect(erroAppSchema.safeParse({ ...base, tipo: "inventado" }).success).toBe(false);
    expect(erroAppSchema.safeParse({ ...base, tela: "x".repeat(201) }).success).toBe(false);
    expect(erroAppSchema.safeParse({ ...base, mensagem: "x".repeat(301) }).success).toBe(false);
  });
  it("a lista de tipos do SQL é a mesma do código", () => {
    const sql = readFileSync("supabase/migrations/20261026_erros_app.sql", "utf8");
    const noSql = [...sql.match(/tipo in \(([^)]*)\)/)![1].matchAll(/'(\w+)'/g)].map((m) => m[1]).sort();
    const noCodigo = [...erroAppSchema.shape.tipo.options].sort();
    expect(noSql).toEqual(noCodigo);
  });
  it("o erro traduzido do banco sempre vira um registro válido", () => {
    const r = interpretarErro(new Error('duplicate key value violates unique constraint "x"'));
    expect(erroAppSchema.safeParse({ codigo: r.codigo, tipo: r.tipo, tela: "/app", mensagem: r.mensagem }).success).toBe(true);
  });
});
