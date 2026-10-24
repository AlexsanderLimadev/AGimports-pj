/** Regras puras do cadastro de vendedores (testáveis, sem banco). */

/** Tira espaços das pontas e junta espaços repetidos: "  Maria   Silva " vira "Maria Silva". */
export function normalizarNome(bruto: string): string {
  return bruto.replace(/\s+/g, " ").trim();
}

/** Chave para comparar nomes sem diferenciar maiúsculas, acento ou espaços. */
export function chaveNome(nome: string): string {
  return normalizarNome(nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type PedidoVenda = { vendedor_id: string | null; total_cents: number };

export type ResumoVendedor = { pedidos: number; totalCents: number };

/** Soma pedidos e faturamento por vendedor. Pedidos sem vendedor ficam de fora. */
export function resumirPorVendedor(pedidos: PedidoVenda[]): Map<string, ResumoVendedor> {
  const out = new Map<string, ResumoVendedor>();
  for (const p of pedidos) {
    if (!p.vendedor_id) continue;
    const r = out.get(p.vendedor_id) ?? { pedidos: 0, totalCents: 0 };
    r.pedidos += 1;
    r.totalCents += p.total_cents;
    out.set(p.vendedor_id, r);
  }
  return out;
}
