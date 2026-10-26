import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { falhar } from "@/lib/erros.server";

/** Tabelas em que "apagar" só marca `deleted_at`, então dá para desfazer. */
export const TABELAS_RESTAURAVEIS = [
  "eventos",
  "automacoes",
  "clientes",
  "financeiro_lancamentos",
  "suppliers",
  "funis",
  "campanhas",
  "metas",
  "pedidos",
  "products",
  "vendedores",
] as const;

export type TabelaRestauravel = (typeof TABELAS_RESTAURAVEIS)[number];

export const restaurarRegistro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ tabela: z.enum(TABELAS_RESTAURAVEIS), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "restaurar", 30);
    // Vendedor apagado também fica inativo; ao restaurar volta a valer.
    const campos = data.tabela === "vendedores" ? { deleted_at: null, ativo: true } : { deleted_at: null };
    const { error } = await (context.supabase as any).from(data.tabela).update(campos).eq("id", data.id);
    if (error) falhar(error, "restaurarRegistro");
    return { ok: true };
  });
