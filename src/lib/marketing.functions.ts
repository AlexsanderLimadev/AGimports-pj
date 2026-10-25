import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const campanhaSchema = z.object({
  nome: z.string().trim().min(1).max(160),
  canal: z.string().trim().min(1).max(40),
  status: z.enum(["rascunho", "ativa", "pausada", "finalizada"]).default("rascunho"),
  budget_cents: z.number().int().min(0).default(0),
  gasto_cents: z.number().int().min(0).default(0),
  receita_cents: z.number().int().min(0).default(0),
  starts_at: z.string().optional().nullable(),
  ends_at: z.string().optional().nullable(),
});

export const listCampanhas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("campanhas")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCampanha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => campanhaSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createCampanha", 40);
    const { data: row, error } = await context.supabase
      .from("campanhas")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCampanha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: campanhaSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("campanhas").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCampanha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("campanhas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
