/** Cálculo puro dos alertas de negócio (margem, estoque parado, reposição). */

export const MARGEM_MINIMA_PADRAO = 20; // em %
export const DIAS_ESTOQUE_PARADO_PADRAO = 60;
const DIA_MS = 86_400_000;

export type ConfigAlertas = { margemMinimaPct: number; diasEstoqueParado: number };

export const CONFIG_ALERTAS_PADRAO: ConfigAlertas = {
  margemMinimaPct: MARGEM_MINIMA_PADRAO,
  diasEstoqueParado: DIAS_ESTOQUE_PARADO_PADRAO,
};

/**
 * Aceita o que veio do banco ou do formulário e devolve valores válidos.
 * O que for inválido (vazio, texto, fora da faixa) volta ao padrão em vez de quebrar os alertas.
 */
export function normalizarConfig(bruto: { margemMinimaPct?: unknown; diasEstoqueParado?: unknown } | null | undefined): ConfigAlertas {
  const m = Number(bruto?.margemMinimaPct);
  const d = Number(bruto?.diasEstoqueParado);
  const margemOk = bruto?.margemMinimaPct !== null && bruto?.margemMinimaPct !== "" && Number.isFinite(m) && m >= 0 && m <= 100;
  const diasOk = bruto?.diasEstoqueParado !== null && bruto?.diasEstoqueParado !== "" && Number.isInteger(d) && d >= 1 && d <= 3650;
  return {
    margemMinimaPct: margemOk ? Math.round(m * 100) / 100 : MARGEM_MINIMA_PADRAO,
    diasEstoqueParado: diasOk ? d : DIAS_ESTOQUE_PARADO_PADRAO,
  };
}

export type ProdutoAlerta = {
  id: string;
  name: string;
  sku: string;
  price_cents: number;
  cost_cents: number;
  stock_qty: number;
  min_stock: number;
  active: boolean;
  created_at: string;
};

export type ProdutoMargemBaixa = {
  id: string;
  nome: string;
  sku: string;
  priceCents: number;
  costCents: number;
  margemPct: number;
};

export type ProdutoParado = {
  id: string;
  nome: string;
  sku: string;
  estoque: number;
  /** null quando nunca foi vendido */
  diasSemVenda: number | null;
  /** quanto dinheiro está parado no estoque (custo x quantidade) */
  capitalParadoCents: number;
};

export type ProdutoReposicao = {
  id: string;
  nome: string;
  sku: string;
  estoque: number;
  minimo: number;
};

export type AlertasNegocio = {
  margemMinimaPct: number;
  diasParado: number;
  margemBaixa: ProdutoMargemBaixa[];
  estoqueParado: ProdutoParado[];
  capitalParadoTotalCents: number;
  reposicao: ProdutoReposicao[];
  total: number;
};

/** Margem sobre o preço de venda. Nula quando preço ou custo não foram informados (nunca inventa número). */
export function margemPct(priceCents: number, costCents: number): number | null {
  if (priceCents <= 0 || costCents <= 0) return null;
  return ((priceCents - costCents) / priceCents) * 100;
}

export function calcularAlertas(
  produtos: ProdutoAlerta[],
  /** data da última venda de cada produto (id -> ISO), só de pedidos válidos */
  ultimaVenda: Map<string, string>,
  agora: Date = new Date(),
  margemMinimaPct: number = MARGEM_MINIMA_PADRAO,
  diasParado: number = DIAS_ESTOQUE_PARADO_PADRAO,
): AlertasNegocio {
  const ativos = produtos.filter((p) => p.active);

  const margemBaixa: ProdutoMargemBaixa[] = [];
  for (const p of ativos) {
    const m = margemPct(p.price_cents, p.cost_cents);
    if (m !== null && m < margemMinimaPct) {
      margemBaixa.push({
        id: p.id,
        nome: p.name,
        sku: p.sku,
        priceCents: p.price_cents,
        costCents: p.cost_cents,
        margemPct: m,
      });
    }
  }
  margemBaixa.sort((a, b) => a.margemPct - b.margemPct);

  const estoqueParado: ProdutoParado[] = [];
  for (const p of ativos) {
    if (p.stock_qty <= 0) continue;
    const venda = ultimaVenda.get(p.id);
    let dias: number | null = null;
    if (venda) {
      dias = Math.floor((agora.getTime() - new Date(venda).getTime()) / DIA_MS);
      if (dias < diasParado) continue;
    } else {
      // Nunca vendeu: só conta como parado se o produto já existe há tempo suficiente.
      const idade = Math.floor((agora.getTime() - new Date(p.created_at).getTime()) / DIA_MS);
      if (idade < diasParado) continue;
    }
    estoqueParado.push({
      id: p.id,
      nome: p.name,
      sku: p.sku,
      estoque: p.stock_qty,
      diasSemVenda: dias,
      capitalParadoCents: p.stock_qty * p.cost_cents,
    });
  }
  // Maior dinheiro parado primeiro.
  estoqueParado.sort((a, b) => b.capitalParadoCents - a.capitalParadoCents);
  const capitalParadoTotalCents = estoqueParado.reduce((a, p) => a + p.capitalParadoCents, 0);

  // Só avisa reposição de quem definiu um mínimo (min_stock 0 = não configurado).
  const reposicao: ProdutoReposicao[] = ativos
    .filter((p) => p.min_stock > 0 && p.stock_qty <= p.min_stock)
    .map((p) => ({ id: p.id, nome: p.name, sku: p.sku, estoque: p.stock_qty, minimo: p.min_stock }))
    .sort((a, b) => a.estoque / a.minimo - b.estoque / b.minimo);

  return {
    margemMinimaPct,
    diasParado,
    margemBaixa,
    estoqueParado,
    capitalParadoTotalCents,
    reposicao,
    total: margemBaixa.length + estoqueParado.length + reposicao.length,
  };
}
