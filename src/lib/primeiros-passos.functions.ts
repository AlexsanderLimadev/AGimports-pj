import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ContagemConta } from "@/lib/primeiros-passos-calc";

export const getContagemConta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContagemConta> => {
    const contar = { count: "exact" as const, head: true };
    const [produtos, comCusto, clientes, vendedores, pedidos] = await Promise.all([
      context.supabase.from("products").select("id", contar).is("deleted_at", null),
      context.supabase.from("products").select("id", contar).is("deleted_at", null).gt("cost_cents", 0),
      context.supabase.from("clientes").select("id", contar).is("deleted_at", null),
      // A tabela de vendedores pode ainda não existir; nesse caso conta como zero.
      context.supabase.from("vendedores").select("id", contar).is("deleted_at", null),
      context.supabase.from("pedidos").select("id", contar).is("deleted_at", null).neq("status", "cancelado"),
    ]);
    const erro = produtos.error ?? comCusto.error ?? clientes.error ?? pedidos.error;
    if (erro) throw new Error(erro.message);
    return {
      produtos: produtos.count ?? 0,
      produtosComCusto: comCusto.count ?? 0,
      clientes: clientes.count ?? 0,
      vendedores: vendedores.error ? 0 : (vendedores.count ?? 0),
      pedidos: pedidos.count ?? 0,
    };
  });
