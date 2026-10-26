import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { falhar } from "@/lib/erros.server";

const TIPOS = ["sessao", "duplicado", "vinculo", "permissao", "campos", "rede", "limite", "banco", "generico"] as const;

export const erroAppSchema = z.object({
  codigo: z.string().regex(/^[A-Z0-9]{3,8}$/),
  tipo: z.enum(TIPOS),
  tela: z.string().max(200),
  mensagem: z.string().max(300),
});

/**
 * Guarda o erro que a pessoa viu. Nunca lança: registrar erro não pode causar outro erro
 * (nem quando a tabela ainda não existe ou o limite de requisições foi atingido).
 */
export const registrarErro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => erroAppSchema.parse(d))
  .handler(async ({ data, context }) => {
    try {
      await enforceRateLimit(context.supabase, context.userId, "registrarErro", 20);
      const { error } = await context.supabase.from("erros_app").insert({ ...data, user_id: context.userId });
      if (error) return { ok: false };
      // Mantém só os últimos 30 dias dos seus erros.
      const limite = new Date(Date.now() - 30 * 86_400_000).toISOString();
      await context.supabase.from("erros_app").delete().eq("user_id", context.userId).lt("created_at", limite);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

export const listErros = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // O banco decide o que cada pessoa pode ver (RLS): só os próprios erros, ou todos se for administrador.
    const { data, error } = await context.supabase
      .from("erros_app")
      .select("id, user_id, codigo, tipo, tela, mensagem, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) falhar(error, "listErros");
    return { linhas: data ?? [], meuId: context.userId };
  });

export const limparErros = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("erros_app").delete().eq("user_id", context.userId);
    if (error) falhar(error, "limparErros");
    return { ok: true };
  });
