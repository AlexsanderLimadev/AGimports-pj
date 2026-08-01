import type { SupabaseClient } from "@supabase/supabase-js";

export type BiOverview = {
  canais: { canal: string; vendas: number }[];
  topProdutos: { nome: string; vendas: number; receita: number }[];
  faturamentoMensal: { mes: string; receita: number; lucro: number }[];
  kpis: {
    receitaTotal: number;
    totalPedidos: number;
    ticketMedio: number;
    totalClientes: number;
    valorEstoque: number;
  };
  computedAt: string;
};

type DB = SupabaseClient<any, any, any>;

/** Recalcula o overview de BI a partir dos dados brutos (últimos 6 meses). */
export async function computeBiOverview(supabase: DB): Promise<BiOverview> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

  const [{ data: pedidos }, { data: itens }, { data: products }, { data: clientes }, { data: fin }] =
    await Promise.all([
      supabase
        .from("pedidos")
        .select("id, canal, total_cents, status, created_at")
        .is("deleted_at", null)
        .gte("created_at", start),
      supabase
        .from("pedido_itens")
        .select("product_id, qty, subtotal_cents, products(name)")
        .limit(2000),
      supabase
        .from("products")
        .select("id, name, cost_cents, price_cents, stock_qty")
        .is("deleted_at", null),
      supabase.from("clientes").select("id").is("deleted_at", null),
      supabase
        .from("financeiro_lancamentos")
        .select("tipo, valor_cents, data, status")
        .is("deleted_at", null)
        .gte("data", start.slice(0, 10)),
    ]);

  const pedidosList = pedidos ?? [];
  const itensList = itens ?? [];

  const canaisMap = new Map<string, number>();
  for (const p of pedidosList) {
    if (p.status === "cancelado") continue;
    canaisMap.set(p.canal, (canaisMap.get(p.canal) ?? 0) + p.total_cents);
  }
  const canais = [...canaisMap.entries()].map(([canal, vendas]) => ({ canal, vendas: vendas / 100 }));

  const prodMap = new Map<string, { nome: string; vendas: number; receita: number }>();
  for (const it of itensList) {
    const key = it.product_id ?? "sem-produto";
    const nome = (it.products as { name?: string } | null)?.name ?? "Produto removido";
    const curr = prodMap.get(key) ?? { nome, vendas: 0, receita: 0 };
    curr.vendas += it.qty;
    curr.receita += it.subtotal_cents / 100;
    prodMap.set(key, curr);
  }
  const topProdutos = [...prodMap.values()].sort((a, b) => b.receita - a.receita).slice(0, 5);

  const meses: Record<string, { receita: number; lucro: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    meses[d.toISOString().slice(0, 7)] = { receita: 0, lucro: 0 };
  }
  for (const p of pedidosList) {
    if (p.status === "cancelado") continue;
    const key = p.created_at.slice(0, 7);
    if (meses[key]) meses[key].receita += p.total_cents / 100;
  }
  for (const l of fin ?? []) {
    if (l.status !== "pago") continue;
    const key = l.data.slice(0, 7);
    if (!meses[key]) continue;
    if (l.tipo === "receita") meses[key].lucro += l.valor_cents / 100;
    else meses[key].lucro -= l.valor_cents / 100;
  }
  const faturamentoMensal = Object.entries(meses).map(([mes, v]) => ({ mes: mes.slice(5), ...v }));

  const validos = pedidosList.filter((p) => p.status !== "cancelado");
  const receitaTotal = validos.reduce((a, p) => a + p.total_cents, 0) / 100;
  const totalPedidos = validos.length;
  const ticketMedio = totalPedidos ? receitaTotal / totalPedidos : 0;
  const totalClientes = clientes?.length ?? 0;
  const valorEstoque = (products ?? []).reduce((a, p) => a + p.stock_qty * p.cost_cents, 0) / 100;

  return {
    canais,
    topProdutos,
    faturamentoMensal,
    kpis: { receitaTotal, totalPedidos, ticketMedio, totalClientes, valorEstoque },
    computedAt: new Date().toISOString(),
  };
}

const TTL_MS = 10 * 60 * 1000;

/** Lê o snapshot pré-calculado; recalcula e persiste quando ausente/expirado ou forçado. */
export async function getBiOverviewCached(
  supabase: DB,
  userId: string,
  opts: { refresh?: boolean } = {},
): Promise<BiOverview> {
  if (!opts.refresh) {
    const { data } = await supabase
      .from("bi_snapshots")
      .select("payload, computed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.payload && Date.now() - new Date(data.computed_at).getTime() < TTL_MS) {
      return data.payload as BiOverview;
    }
  }

  const fresh = await computeBiOverview(supabase);
  const { error } = await supabase
    .from("bi_snapshots")
    .upsert(
      { user_id: userId, payload: fresh, computed_at: fresh.computedAt },
      { onConflict: "user_id" },
    );
  if (error) console.warn("[bi] falha ao gravar snapshot:", error.message);
  return fresh;
}

/** Invalida o snapshot para forçar recálculo no próximo acesso. */
export async function invalidateBiSnapshot(supabase: DB, userId: string): Promise<void> {
  const { error } = await supabase.from("bi_snapshots").delete().eq("user_id", userId);
  if (error) console.warn("[bi] falha ao invalidar snapshot:", error.message);
}
