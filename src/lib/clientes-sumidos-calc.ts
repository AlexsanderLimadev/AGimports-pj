/**
 * Clientes que compravam e pararam. Função pura, só dado real:
 * um cliente só entra na lista se já tem pelo menos um pedido (não cancelado).
 */

export type ClienteBase = {
  id: string;
  nome: string;
  telefone: string | null;
};

export type PedidoBase = {
  cliente_id: string | null;
  total_cents: number;
  created_at: string;
};

export type ClienteResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  ultimaCompra: string;
  totalPedidos: number;
  totalGastoCents: number;
  ticketMedioCents: number;
};

export type ClienteSumido = ClienteResumo & { diasSemComprar: number };

export const DIAS_PADRAO = 60;
export const DIAS_OPCOES = [30, 60, 90, 180] as const;

const DIA_MS = 86_400_000;

/** Junta pedidos por cliente. Pedido sem cliente cadastrado é ignorado. */
export function resumirClientes(clientes: ClienteBase[], pedidos: PedidoBase[]): {
  compradores: ClienteResumo[];
  semCompra: number;
} {
  const porCliente = new Map<string, PedidoBase[]>();
  for (const p of pedidos) {
    if (!p.cliente_id) continue;
    const lista = porCliente.get(p.cliente_id);
    if (lista) lista.push(p);
    else porCliente.set(p.cliente_id, [p]);
  }

  const compradores: ClienteResumo[] = [];
  let semCompra = 0;
  for (const c of clientes) {
    const lista = porCliente.get(c.id);
    if (!lista || lista.length === 0) {
      semCompra++;
      continue;
    }
    let ultima = lista[0].created_at;
    let total = 0;
    for (const p of lista) {
      if (p.created_at > ultima) ultima = p.created_at;
      total += p.total_cents;
    }
    compradores.push({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone,
      ultimaCompra: ultima,
      totalPedidos: lista.length,
      totalGastoCents: total,
      ticketMedioCents: Math.round(total / lista.length),
    });
  }
  return { compradores, semCompra };
}

/** Quem está há `dias` ou mais sem comprar. Os que mais gastaram vêm primeiro. */
export function filtrarSumidos(compradores: ClienteResumo[], agora: Date, dias: number): ClienteSumido[] {
  const limite = Number.isFinite(dias) && dias > 0 ? dias : DIAS_PADRAO;
  return compradores
    .map((c) => ({
      ...c,
      diasSemComprar: Math.max(0, Math.floor((agora.getTime() - new Date(c.ultimaCompra).getTime()) / DIA_MS)),
    }))
    .filter((c) => c.diasSemComprar >= limite)
    .sort((a, b) => b.totalGastoCents - a.totalGastoCents || b.diasSemComprar - a.diasSemComprar);
}

/** Telefone brasileiro para o wa.me (só dígitos, com 55). Nulo se não der para confiar. */
export function telefoneWhatsApp(telefone: string | null): string | null {
  if (!telefone) return null;
  const d = telefone.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) return d;
  return null;
}

export function linkWhatsApp(c: Pick<ClienteSumido, "nome" | "telefone">): string | null {
  const tel = telefoneWhatsApp(c.telefone);
  if (!tel) return null;
  const primeiro = c.nome.trim().split(/\s+/)[0] || "";
  const texto = `Oi${primeiro ? `, ${primeiro}` : ""}! Tudo bem? Faz um tempo que a gente não se fala. Posso te ajudar com alguma coisa?`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
}
