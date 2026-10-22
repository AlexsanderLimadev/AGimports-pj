/** Cálculo puro do Dashboard Analítico, isolado do banco para poder ser testado. */

export type ProdutoDestaque = { nome: string; priceCents: number };
export type ProdutoVendas = { nome: string; qtd: number; receitaCents: number };
export type VendedorRank = { nome: string; totalCents: number; pedidos: number };

export type AnaliseNegocio = {
  totalPedidos: number;
  receitaTotalCents: number;
  mesAtualCents: number;
  mesAnteriorCents: number;
  mesVariacaoPct: number | null;
  anoAtualCents: number;
  anoAnteriorCents: number;
  anoVariacaoPct: number | null;
  roiPct: number | null;
  maisBarato: ProdutoDestaque | null;
  maisCaro: ProdutoDestaque | null;
  maisVendido: ProdutoVendas | null;
  menosVendido: ProdutoVendas | null;
  produtosSemVenda: { nome: string }[];
  ranking: VendedorRank[];
  vendedorTop: VendedorRank | null;
  vendedorBottom: VendedorRank | null;
  totalVendedores: number;
};

function variacao(atual: number, anterior: number): number | null {
  return anterior > 0 ? ((atual - anterior) / anterior) * 100 : null;
}

export type ProdutoRow = { id: string; name: string; price_cents: number; cost_cents: number };
export type PedidoRow = { id: string; total_cents: number; created_at: string; vendedor_nome: string | null };
export type ItemRow = {
  pedido_id: string;
  product_id: string | null;
  descricao_snapshot: string;
  qty: number;
  subtotal_cents: number;
};

export function calcularAnalise(
  produtos: ProdutoRow[],
  pedidos: PedidoRow[],
  todosItens: ItemRow[],
  agora: Date = new Date(),
): AnaliseNegocio {
  const pedidoIds = new Set(pedidos.map((p) => p.id));
  const itens = todosItens.filter((i) => pedidoIds.has(i.pedido_id));

  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const mesPrev = mes === 0 ? 11 : mes - 1;
  const anoMesPrev = mes === 0 ? ano - 1 : ano;

  let mesAtual = 0, mesAnterior = 0, anoAtual = 0, anoAnterior = 0, receitaTotal = 0;
  for (const p of pedidos) {
    const d = new Date(p.created_at);
    receitaTotal += p.total_cents;
    if (d.getFullYear() === ano) anoAtual += p.total_cents;
    if (d.getFullYear() === ano - 1) anoAnterior += p.total_cents;
    if (d.getFullYear() === ano && d.getMonth() === mes) mesAtual += p.total_cents;
    if (d.getFullYear() === anoMesPrev && d.getMonth() === mesPrev) mesAnterior += p.total_cents;
  }

  // Produtos por preço (ignora preço zero)
  const comPreco = produtos.filter((p) => p.price_cents > 0);
  const ordenado = [...comPreco].sort((a, b) => a.price_cents - b.price_cents);
  const maisBarato = ordenado[0] ? { nome: ordenado[0].name, priceCents: ordenado[0].price_cents } : null;
  const ultimo = ordenado[ordenado.length - 1];
  const maisCaro = ultimo ? { nome: ultimo.name, priceCents: ultimo.price_cents } : null;

  // Vendas por produto e ROI (custo só de itens ligados a produto)
  const prodMap = new Map(produtos.map((p) => [p.id, p]));
  const vendas = new Map<string, ProdutoVendas>();
  let receitaComCusto = 0, custoTotal = 0;
  for (const it of itens) {
    const prod = it.product_id ? prodMap.get(it.product_id) : undefined;
    const chave = it.product_id ?? `x:${it.descricao_snapshot}`;
    const nome = prod?.name ?? it.descricao_snapshot;
    const v = vendas.get(chave) ?? { nome, qtd: 0, receitaCents: 0 };
    v.qtd += it.qty;
    v.receitaCents += it.subtotal_cents;
    vendas.set(chave, v);
    if (prod && prod.cost_cents > 0) {
      receitaComCusto += it.subtotal_cents;
      custoTotal += prod.cost_cents * it.qty;
    }
  }
  const lista = [...vendas.values()].sort((a, b) => b.qtd - a.qtd);
  const maisVendido = lista[0] ?? null;
  const menosVendido = lista.length >= 2 ? lista[lista.length - 1] : null;
  const roiPct = custoTotal > 0 ? ((receitaComCusto - custoTotal) / custoTotal) * 100 : null;

  const vendidosIds = new Set(itens.map((i) => i.product_id).filter(Boolean));
  const produtosSemVenda = produtos
    .filter((p) => !vendidosIds.has(p.id))
    .map((p) => ({ nome: p.name }));

  // Ranking de vendedores
  const vend = new Map<string, VendedorRank>();
  for (const p of pedidos) {
    const nome = p.vendedor_nome?.trim();
    if (!nome) continue;
    const v = vend.get(nome) ?? { nome, totalCents: 0, pedidos: 0 };
    v.totalCents += p.total_cents;
    v.pedidos += 1;
    vend.set(nome, v);
  }
  const ranking = [...vend.values()].sort((a, b) => b.totalCents - a.totalCents);

  return {
    totalPedidos: pedidos.length,
    receitaTotalCents: receitaTotal,
    mesAtualCents: mesAtual,
    mesAnteriorCents: mesAnterior,
    mesVariacaoPct: variacao(mesAtual, mesAnterior),
    anoAtualCents: anoAtual,
    anoAnteriorCents: anoAnterior,
    anoVariacaoPct: variacao(anoAtual, anoAnterior),
    roiPct,
    maisBarato,
    maisCaro,
    maisVendido,
    menosVendido,
    produtosSemVenda,
    ranking,
    vendedorTop: ranking[0] ?? null,
    vendedorBottom: ranking.length >= 2 ? ranking[ranking.length - 1] : null,
    totalVendedores: ranking.length,
  };
}
