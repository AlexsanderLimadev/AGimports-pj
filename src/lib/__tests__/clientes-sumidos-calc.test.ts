import { describe, expect, it } from "vitest";
import { filtrarSumidos, linkWhatsApp, resumirClientes, telefoneWhatsApp } from "@/lib/clientes-sumidos-calc";

const AGORA = new Date("2026-10-25T12:00:00Z");
const atras = (n: number) => new Date(AGORA.getTime() - n * 86_400_000).toISOString();
const cli = (id: string, nome = id, telefone: string | null = null) => ({ id, nome, telefone });
const ped = (cliente_id: string | null, dias: number, total_cents = 10000) => ({
  cliente_id,
  total_cents,
  created_at: atras(dias),
});

describe("resumirClientes", () => {
  it("soma pedidos, acha a última compra e calcula o ticket médio", () => {
    const r = resumirClientes([cli("a")], [ped("a", 100, 10000), ped("a", 10, 30000)]);
    expect(r.compradores).toHaveLength(1);
    expect(r.compradores[0].totalPedidos).toBe(2);
    expect(r.compradores[0].totalGastoCents).toBe(40000);
    expect(r.compradores[0].ticketMedioCents).toBe(20000);
    expect(r.compradores[0].ultimaCompra).toBe(atras(10));
  });
  it("cliente sem pedido não é comprador, só conta à parte", () => {
    const r = resumirClientes([cli("a"), cli("b")], [ped("a", 5)]);
    expect(r.compradores.map((c) => c.id)).toEqual(["a"]);
    expect(r.semCompra).toBe(1);
  });
  it("ignora pedido sem cliente e de cliente inexistente", () => {
    const r = resumirClientes([cli("a")], [ped(null, 5), ped("zzz", 5)]);
    expect(r.compradores).toHaveLength(0);
    expect(r.semCompra).toBe(1);
  });
});

describe("filtrarSumidos", () => {
  const { compradores } = resumirClientes(
    [cli("novo"), cli("velho"), cli("caro")],
    [ped("novo", 5), ped("velho", 90, 5000), ped("caro", 70, 90000)],
  );
  it("só traz quem passou do limite de dias", () => {
    expect(filtrarSumidos(compradores, AGORA, 60).map((c) => c.id)).toEqual(["caro", "velho"]);
    expect(filtrarSumidos(compradores, AGORA, 80).map((c) => c.id)).toEqual(["velho"]);
  });
  it("quem gastou mais vem primeiro", () => {
    const r = filtrarSumidos(compradores, AGORA, 30);
    expect(r[0].id).toBe("caro");
  });
  it("calcula os dias sem comprar", () => {
    expect(filtrarSumidos(compradores, AGORA, 60).find((c) => c.id === "velho")?.diasSemComprar).toBe(90);
  });
  it("o limite exato entra (>=)", () => {
    expect(filtrarSumidos(compradores, AGORA, 90).map((c) => c.id)).toEqual(["velho"]);
  });
  it("limite inválido volta ao padrão de 60", () => {
    expect(filtrarSumidos(compradores, AGORA, NaN).map((c) => c.id)).toEqual(["caro", "velho"]);
  });
  it("lista vazia não quebra", () => {
    expect(filtrarSumidos([], AGORA, 60)).toEqual([]);
  });
});

describe("whatsapp", () => {
  it("normaliza celular com DDD", () => {
    expect(telefoneWhatsApp("(11) 91234-5678")).toBe("5511912345678");
    expect(telefoneWhatsApp("1133334444")).toBe("551133334444");
  });
  it("aceita número que já tem 55", () => {
    expect(telefoneWhatsApp("+55 11 91234-5678")).toBe("5511912345678");
  });
  it("não inventa: telefone curto, vazio ou nulo dá nulo", () => {
    expect(telefoneWhatsApp("91234-5678")).toBeNull();
    expect(telefoneWhatsApp("")).toBeNull();
    expect(telefoneWhatsApp(null)).toBeNull();
  });
  it("o link usa o primeiro nome e codifica o texto", () => {
    const l = linkWhatsApp({ nome: "Maria da Silva", telefone: "11912345678" })!;
    expect(l.startsWith("https://wa.me/5511912345678?text=")).toBe(true);
    expect(decodeURIComponent(l)).toContain("Oi, Maria!");
  });
  it("sem telefone válido não tem link", () => {
    expect(linkWhatsApp({ nome: "X", telefone: null })).toBeNull();
  });
});
