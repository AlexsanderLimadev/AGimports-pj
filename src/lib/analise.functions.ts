import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { calcularAnalise, type AnaliseNegocio } from "@/lib/analise-calc";

export type {
  AnaliseNegocio,
  ProdutoDestaque,
  ProdutoVendas,
  VendedorRank,
} from "@/lib/analise-calc";
import { falhar } from "@/lib/erros.server";

export const getAnaliseNegocio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnaliseNegocio> => {
    const [prodRes, pedRes, itRes] = await Promise.all([
      context.supabase
        .from("products")
        .select("id, name, price_cents, cost_cents")
        .is("deleted_at", null)
        .eq("active", true),
      context.supabase
        .from("pedidos")
        .select("id, total_cents, created_at, vendedor_nome")
        .is("deleted_at", null)
        .neq("status", "cancelado"),
      context.supabase
        .from("pedido_itens")
        .select("pedido_id, product_id, descricao_snapshot, qty, subtotal_cents"),
    ]);
    const erro = prodRes.error ?? pedRes.error ?? itRes.error;
    if (erro) falhar(erro, "analise");

    return calcularAnalise(prodRes.data ?? [], pedRes.data ?? [], itRes.data ?? []);
  });
