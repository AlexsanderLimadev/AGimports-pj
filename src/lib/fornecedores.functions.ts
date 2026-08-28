import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().max(200).email("E-mail inválido").optional().nullable().or(z.literal("")),
  notes: z.string().max(2000).optional().nullable(),
  is_international: z.boolean().default(false),
});

export const listSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Junta a contagem de produtos vinculados a cada fornecedor — é a base
    // pra comparar "quem eu mais compro" sem precisar de tela nova.
    const { data, error } = await context.supabase
      .from("suppliers")
      .select("id, name, contact_name, phone, email, notes, is_international, created_at, products(id, cost_cents)")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((s: any) => ({
      ...s,
      products: undefined,
      productCount: s.products?.length ?? 0,
      avgCostCents:
        s.products?.length > 0
          ? Math.round(s.products.reduce((a: number, p: any) => a + (p.cost_cents ?? 0), 0) / s.products.length)
          : 0,
    }));
  });

export const createSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => supplierSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createSupplier", 40);
    const { data: row, error } = await context.supabase
      .from("suppliers")
      .insert({
        user_id: context.userId,
        name: data.name,
        contact_name: data.contact_name || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
        is_international: data.is_international,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: supplierSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("suppliers")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("suppliers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
