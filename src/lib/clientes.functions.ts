import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { withCapture } from "@/lib/observability.server";
import { falhar } from "@/lib/erros.server";


export const clienteSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  email: z.string().trim().max(200).email("E-mail inválido").optional().nullable().or(z.literal("")),
  telefone: z.string().max(40).optional().nullable(),
  documento: z.string().max(40).optional().nullable(),
  tags: z.array(z.string().max(40)).default([]),
  notes: z.string().max(2000).optional().nullable(),
});

export const listClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("clientes")
      .select("id, nome, email, telefone, documento, tags, notes, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) falhar(error, "clientes");
    return data ?? [];
  });

export const getCliente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: cliente, error } = await context.supabase
      .from("clientes")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) falhar(error, "clientes");
    const { data: pedidos } = await context.supabase
      .from("pedidos")
      .select("id, numero, status, canal, total_cents, created_at")
      .eq("cliente_id", data.id)
      .order("created_at", { ascending: false });
    return { cliente, pedidos: pedidos ?? [] };
  });

export const createCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => clienteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createCliente", 40);
    return withCapture("createCliente", context.userId, async () => {
      const { data: row, error } = await context.supabase
        .from("clientes")
        .insert({ ...data, user_id: context.userId })
        .select("id")
        .single();
      if (error) falhar(error, "clientes");
      return row;
    });
  });


export const updateCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: clienteSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clientes").update(data.patch).eq("id", data.id);
    if (error) falhar(error, "clientes");
    return { ok: true };
  });

export const deleteCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("clientes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) falhar(error, "clientes");
    return { ok: true };
  });
