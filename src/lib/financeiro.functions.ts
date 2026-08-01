import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { withCapture } from "@/lib/observability.server";


const finSchema = z.object({
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.string().max(80).optional().nullable(),
  descricao: z.string().trim().min(1).max(200),
  valor_cents: z.number().int().min(0),
  data: z.string(),
  status: z.enum(["pendente", "pago", "atrasado", "cancelado"]).default("pendente"),
  pedido_id: z.string().uuid().optional().nullable(),
});

export const listLancamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ from: z.string().optional(), to: z.string().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("financeiro_lancamentos")
      .select("id, tipo, categoria, descricao, valor_cents, data, status, pedido_id, created_at")
      .is("deleted_at", null)
      .order("data", { ascending: false })
      .limit(1000);
    if (data.from) q = q.gte("data", data.from);
    if (data.to) q = q.lte("data", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => finSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createLancamento", 60);
    return withCapture("createLancamento", context.userId, async () => {
      const { data: row, error } = await context.supabase
        .from("financeiro_lancamentos")
        .insert({ ...data, user_id: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return row;
    });
  });


export const updateLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: finSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financeiro_lancamentos")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("financeiro_lancamentos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
