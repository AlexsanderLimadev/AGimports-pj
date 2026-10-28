import { describe, expect, it } from "vitest";
import {
  codigoValido,
  exigeSegundaEtapa,
  fatoresTotpPendentes,
  fatoresTotpVerificados,
  limparCodigo,
  traduzirErroMfa,
} from "@/lib/mfa-calc";

describe("exigeSegundaEtapa", () => {
  it("exige quando tem o segundo passo ativo e a sessão ainda é só de senha", () => {
    expect(exigeSegundaEtapa({ currentLevel: "aal1", nextLevel: "aal2" })).toBe(true);
  });
  it("não exige depois de verificar o código", () => {
    expect(exigeSegundaEtapa({ currentLevel: "aal2", nextLevel: "aal2" })).toBe(false);
  });
  it("não exige de quem nunca ativou", () => {
    expect(exigeSegundaEtapa({ currentLevel: "aal1", nextLevel: "aal1" })).toBe(false);
  });
  it("não trava ninguém quando não há informação", () => {
    expect(exigeSegundaEtapa(null)).toBe(false);
    expect(exigeSegundaEtapa(undefined)).toBe(false);
    expect(exigeSegundaEtapa({ currentLevel: null, nextLevel: null })).toBe(false);
  });
});

describe("código de 6 dígitos", () => {
  it("limpa espaços, traços e letras e corta em 6", () => {
    expect(limparCodigo("123 456")).toBe("123456");
    expect(limparCodigo("123-456")).toBe("123456");
    expect(limparCodigo("12a3b4c5d6e7f8")).toBe("123456");
    expect(limparCodigo("")).toBe("");
  });
  it("só aceita exatamente 6 dígitos", () => {
    expect(codigoValido("123456")).toBe(true);
    expect(codigoValido("12345")).toBe(false);
    expect(codigoValido("1234567")).toBe(false);
    expect(codigoValido("12345a")).toBe(false);
    expect(codigoValido("")).toBe(false);
  });
});

describe("fatores", () => {
  const lista = [
    { id: "1", factor_type: "totp", status: "verified" },
    { id: "2", factor_type: "totp", status: "unverified" },
    { id: "3", factor_type: "phone", status: "verified" },
  ];
  it("separa verificados e pendentes só do tipo aplicativo", () => {
    expect(fatoresTotpVerificados(lista).map((f) => f.id)).toEqual(["1"]);
    expect(fatoresTotpPendentes(lista).map((f) => f.id)).toEqual(["2"]);
  });
  it("lida com lista vazia ou nula", () => {
    expect(fatoresTotpVerificados(null)).toEqual([]);
    expect(fatoresTotpPendentes(undefined)).toEqual([]);
  });
});

describe("traduzirErroMfa", () => {
  it.each([
    ["Invalid TOTP code entered", /incorreto ou vencido/],
    ["Rate limit exceeded", /Muitas tentativas/],
    ["MFA enroll is disabled for TOTP", /desligada no Supabase/],
    ["AAL2 required to unenroll", /confirme antes/],
    ["Factor not found", /não existe mais/],
    ["JWT expired", /sessão acabou/],
    ["algo inesperado", /Não foi possível/],
  ])("%s vira frase em português", (entrada, esperado) => {
    expect(traduzirErroMfa(entrada)).toMatch(esperado);
  });
  it("nenhuma frase tem travessão", () => {
    for (const e of ["Invalid TOTP code", "rate limit", "enroll disabled", "aal2", "x"]) {
      expect(traduzirErroMfa(e)).not.toMatch(/—|–/);
    }
  });
});
