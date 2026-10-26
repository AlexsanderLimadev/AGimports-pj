import { describe, expect, it } from "vitest";
import {
  classificarErroBanco,
  codificarErroServidor,
  gerarCodigoErro,
  interpretarErro,
} from "@/lib/erros-calc";

const fixo = () => 0; // sorteio previsível: sempre a 1ª letra do alfabeto

describe("gerarCodigoErro", () => {
  it("tem 4 caracteres e nunca usa letras confusas", () => {
    for (let i = 0; i < 200; i++) {
      const c = gerarCodigoErro();
      expect(c).toHaveLength(4);
      expect(c).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    }
  });
  it("é previsível com sorteio injetado", () => {
    expect(gerarCodigoErro(fixo)).toBe("AAAA");
  });
});

describe("classificarErroBanco", () => {
  it.each([
    ["23505", "duplicado"],
    ["23503", "vinculo"],
    ["23502", "campos"],
    ["23514", "campos"],
    ["22P02", "campos"],
    ["42501", "permissao"],
    ["PGRST301", "sessao"],
    ["42P01", "banco"],
    ["PGRST205", "banco"],
  ])("código %s vira %s", (code, tipo) => {
    expect(classificarErroBanco({ code, message: "x" }).tipo).toBe(tipo);
  });
  it("reconhece sessão vencida pela mensagem", () => {
    expect(classificarErroBanco({ message: "JWT expired" }).tipo).toBe("sessao");
    expect(classificarErroBanco({ message: "Unauthorized: No token provided" }).tipo).toBe("sessao");
  });
  it("reconhece falta de internet", () => {
    expect(classificarErroBanco({ message: "Failed to fetch" }).tipo).toBe("rede");
    expect(classificarErroBanco({ message: "TypeError: fetch failed" }).tipo).toBe("rede");
  });
  it("reconhece limite de requisições", () => {
    expect(classificarErroBanco({ message: "Muitas requisições. Aguarde um instante e tente novamente." }).tipo).toBe("limite");
  });
  it("o que não conhece vira genérico", () => {
    expect(classificarErroBanco({ message: "algo estranho", code: "ZZ999" }).tipo).toBe("generico");
  });
  it("nenhuma frase tem travessão nem vaza nome técnico", () => {
    for (const code of ["23505", "23503", "23502", "42501", "42P01", "57014", "PGRST116"]) {
      const m = classificarErroBanco({ code, message: 'relation "products" does not exist' }).mensagem;
      expect(m).not.toMatch(/—|–/);
      expect(m).not.toMatch(/relation|products|constraint|PGRST/i);
    }
  });
});

describe("interpretarErro", () => {
  it("lê a marca que o servidor coloca (código e tipo)", () => {
    const msg = codificarErroServidor({ tipo: "duplicado", mensagem: "Já existe.", codigo: "A7K2" });
    const r = interpretarErro(new Error(msg));
    expect(r).toEqual({ tipo: "duplicado", mensagem: "Já existe.", codigo: "A7K2" });
  });
  it("mensagem escrita de propósito em português passa direto, sem código", () => {
    const r = interpretarErro(new Error("Vendedor não encontrado. Atualize a página e tente de novo."));
    expect(r.mensagem).toBe("Vendedor não encontrado. Atualize a página e tente de novo.");
    expect(r.codigo).toBeNull();
  });
  it("mensagem técnica não vai para a tela e ganha código", () => {
    const r = interpretarErro(new Error('duplicate key value violates unique constraint "vendedores_nome_idx"'), fixo);
    expect(r.mensagem).not.toMatch(/violates|constraint|vendedores_nome_idx/);
    expect(r.codigo).toBe("AAAA");
  });
  it("erro de validação (JSON do zod) vira aviso de campos", () => {
    const zod = JSON.stringify([{ code: "too_small", path: ["nome"], message: "Required" }]);
    const r = interpretarErro(new Error(zod));
    expect(r.tipo).toBe("campos");
    expect(r.mensagem).not.toContain("Required");
  });
  it("sessão vencida não pede código", () => {
    const r = interpretarErro(new Error("Unauthorized: No authorization header provided"));
    expect(r.tipo).toBe("sessao");
    expect(r.codigo).toBeNull();
  });
  it("aceita texto solto, objeto e vazio sem quebrar", () => {
    expect(interpretarErro("Failed to fetch").tipo).toBe("rede");
    expect(interpretarErro({ message: "JWT expired" }).tipo).toBe("sessao");
    expect(interpretarErro(undefined).tipo).toBe("generico");
    expect(interpretarErro(null).tipo).toBe("generico");
  });
  it("marca com tipo desconhecido é ignorada", () => {
    const r = interpretarErro(new Error("texto [ref:ABCD:inventado]"));
    expect(r.codigo).not.toBe("ABCD");
  });
});
