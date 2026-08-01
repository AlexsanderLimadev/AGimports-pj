/** Cálculo puro de totais de pedido — isolado para permitir testes automatizados. */

export type ResolvedItem = {
  product_id: string | null;
  descricao_snapshot: string;
  qty: number;
  unit_price_cents: number;
};

export type IncomingItem = {
  product_id?: string | null | undefined;
  descricao_snapshot: string;
  qty: number;
  unit_price_cents: number;
};

export type ProductPrice = { price_cents: number; name: string; sku: string };

/**
 * Resolve itens usando SEMPRE o preço autoritativo do produto quando há product_id.
 * Itens avulsos (sem product_id) mantêm o preço informado.
 * Lança se um product_id não existir no mapa (produto inexistente ou sem acesso).
 */
export function resolveItens(
  itens: IncomingItem[],
  priceMap: Map<string, ProductPrice>,
): ResolvedItem[] {
  return itens.map((it) => {
    if (it.product_id) {
      const p = priceMap.get(it.product_id);
      if (!p) throw new Error(`Produto ${it.product_id} inválido ou sem acesso`);
      return {
        product_id: it.product_id,
        descricao_snapshot: `${p.sku} · ${p.name}`,
        qty: it.qty,
        unit_price_cents: p.price_cents,
      };
    }
    return {
      product_id: null,
      descricao_snapshot: it.descricao_snapshot,
      qty: it.qty,
      unit_price_cents: it.unit_price_cents,
    };
  });
}

export function subtotalCents(item: { qty: number; unit_price_cents: number }): number {
  return item.qty * item.unit_price_cents;
}

export function totalCents(itens: { qty: number; unit_price_cents: number }[]): number {
  return itens.reduce((acc, it) => acc + subtotalCents(it), 0);
}
