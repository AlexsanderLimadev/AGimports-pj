import { describe, expect, it } from "vitest";
import { nomeDoSite, normalizarLink } from "@/lib/link-calc";

const url = (t: string) => {
  const r = normalizarLink(t);
  return r.ok ? r.url : `ERRO: ${r.erro}`;
};

describe("normalizarLink", () => {
  it("vazio ou só espaços vira nulo, sem erro", () => {
    expect(normalizarLink("")).toEqual({ ok: true, url: null });
    expect(normalizarLink("   ")).toEqual({ ok: true, url: null });
    expect(normalizarLink(null)).toEqual({ ok: true, url: null });
    expect(normalizarLink(undefined)).toEqual({ ok: true, url: null });
  });
  it("mantém link completo", () => {
    expect(url("https://www.loja.com.br/produto/123?cor=azul")).toBe("https://www.loja.com.br/produto/123?cor=azul");
    expect(url("http://loja.com/p")).toBe("http://loja.com/p");
  });
  it("acrescenta https:// quando a pessoa cola sem", () => {
    expect(url("www.loja.com.br/p/9")).toBe("https://www.loja.com.br/p/9");
    expect(url("loja.com/p")).toBe("https://loja.com/p");
    expect(url("//loja.com/p")).toBe("https://loja.com/p");
  });
  it("tira espaços nas pontas", () => {
    expect(url("  https://loja.com/p  ")).toBe("https://loja.com/p");
  });
  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://loja.com/arquivo",
    "mailto:a@b.com",
    "blob:https://loja.com/abc",
  ])("recusa %s", (perigoso) => {
    expect(normalizarLink(perigoso).ok).toBe(false);
  });
  it("recusa texto que não é link, espaços no meio e senha embutida", () => {
    expect(normalizarLink("comprar na loja").ok).toBe(false);
    expect(normalizarLink("https://loja.com/a b").ok).toBe(false);
    expect(normalizarLink("abc").ok).toBe(false);
    expect(normalizarLink("https://user:senha@loja.com/p").ok).toBe(false);
  });
  it("recusa link com mais de 2000 caracteres", () => {
    expect(normalizarLink("https://loja.com/" + "a".repeat(2000)).ok).toBe(false);
  });
  it("as mensagens de erro não têm travessão", () => {
    for (const t of ["x", "javascript:1", "a b.com", "https://u:p@a.com"]) {
      const r = normalizarLink(t);
      if (!r.ok) expect(r.erro).not.toMatch(/—|–/);
    }
  });
});

describe("nomeDoSite", () => {
  it("mostra só o domínio, sem www", () => {
    expect(nomeDoSite("https://www.loja.com.br/p/123")).toBe("loja.com.br");
    expect(nomeDoSite("https://shop.exemplo.com/x")).toBe("shop.exemplo.com");
  });
  it("devolve vazio para nulo ou lixo", () => {
    expect(nomeDoSite(null)).toBe("");
    expect(nomeDoSite("não é link")).toBe("");
  });
});
