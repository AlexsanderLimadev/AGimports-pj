import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resumirClientes, type ClienteResumo } from "@/lib/clientes-sumidos-calc";

export type ClientesCompradores = { compradores: ClienteResumo[]; semCompra: number };

export const getClientesCompradores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ClientesCompradores> => {
    const [cliRes, pedRes] = await Promise.all([
      context.supabase.from("clientes").select("id, nome, telefone").is("deleted_at", null),
      context.supabase
        .from("pedidos")
        .select("cliente_id, total_cents, created_at")
        .is("deleted_at", null)
        .neq("status", "cancelado")
        .not("cliente_id", "is", null),
    ]);
    const erro = cliRes.error ?? pedRes.error;
    if (erro) throw new Error(erro.message);
    return resumirClientes(cliRes.data ?? [], pedRes.data ?? []);
  });
