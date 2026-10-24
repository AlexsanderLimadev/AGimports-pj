import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularAlertas, type AlertasNegocio } from "@/lib/alertas-calc";

export type { AlertasNegocio } from "@/lib/alertas-calc";

export const getAlertasNegocio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AlertasNegocio> => {
    const [prodRes, pedRes, itRes] = await Promise.all([
      context.supabase
        .from("products")
        .select("id, name, sku, price_cents, cost_cents, stock_qty, min_stock, active, created_at")
        .is("deleted_at", null),
      context.supabase
        .from("pedidos")
        .select("id, created_at")
        .is("deleted_at", null)
        .neq("status", "cancelado"),
      context.supabase.from("pedido_itens").select("pedido_id, product_id").not("product_id", "is", null),
    ]);
    const erro = prodRes.error ?? pedRes.error ?? itRes.error;
    if (erro) throw new Error(erro.message);

    const dataPedido = new Map((pedRes.data ?? []).map((p) => [p.id, p.created_at]));
    const ultimaVenda = new Map<string, string>();
    for (const it of itRes.data ?? []) {
      const quando = dataPedido.get(it.pedido_id);
      if (!quando || !it.product_id) continue; // item de pedido cancelado
      const atual = ultimaVenda.get(it.product_id);
      if (!atual || quando > atual) ultimaVenda.set(it.product_id, quando);
    }

    return calcularAlertas(prodRes.data ?? [], ultimaVenda);
  });
