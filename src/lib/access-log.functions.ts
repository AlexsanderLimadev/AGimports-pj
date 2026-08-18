import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const eventSchema = z.enum(["sign_in", "sign_out", "sign_up", "password_reset"]);

/**
 * Registra um evento de acesso. Chamado logo após login/logout bem
 * sucedidos. Falha "em silêncio" de propósito — se o log não gravar por
 * algum motivo, isso nunca deve impedir o usuário de continuar usando o
 * sistema (log é auditoria, não trava de acesso).
 */
export const logAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ event: eventSchema, userAgent: z.string().max(400).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("access_logs").insert({
      user_id: context.userId,
      event: data.event,
      user_agent: data.userAgent ?? null,
    });
    if (error) console.error("[access-log] falha ao registrar:", error.message);
    return { ok: true };
  });

export const listAccessLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("access_logs")
      .select("id, event, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
