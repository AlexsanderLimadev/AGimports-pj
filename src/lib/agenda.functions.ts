import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { falhar } from "@/lib/erros.server";

const EVENTO_TIPOS = ["compromisso", "entrega", "cobranca", "reposicao", "reuniao", "outro"] as const;
const EVENTO_STATUS = ["pendente", "concluido", "cancelado"] as const;

const eventoSchema = z.object({
  titulo: z.string().trim().min(1).max(200),
  descricao: z.string().max(2000).optional().nullable(),
  tipo: z.enum(EVENTO_TIPOS).default("compromisso"),
  status: z.enum(EVENTO_STATUS).default("pendente"),
  starts_at: z.string().min(1),
  ends_at: z.string().optional().nullable(),
  all_day: z.boolean().default(false),
  cliente_id: z.string().uuid().optional().nullable(),
  pedido_id: z.string().uuid().optional().nullable(),
  product_id: z.string().uuid().optional().nullable(),
});

export const listEventos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("eventos")
      .select("id, titulo, descricao, tipo, status, starts_at, ends_at, all_day, cliente_id, pedido_id, product_id")
      .is("deleted_at", null)
      .gte("starts_at", data.from)
      .lt("starts_at", data.to)
      .order("starts_at", { ascending: true });
    if (error) falhar(error, "agenda");
    return rows ?? [];
  });

export const createEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => eventoSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createEvento", 60);
    const payload = { ...data, user_id: context.userId, ends_at: data.ends_at || null };
    const { data: row, error } = await context.supabase
      .from("eventos")
      .insert(payload)
      .select("id")
      .single();
    if (error) falhar(error, "agenda");
    return row;
  });

export const updateEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: eventoSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("eventos")
      .update(data.patch)
      .eq("id", data.id);
    if (error) falhar(error, "agenda");
    return { ok: true };
  });

export const deleteEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("eventos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) falhar(error, "agenda");
    return { ok: true };
  });
