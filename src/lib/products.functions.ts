import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { falhar } from "@/lib/erros.server";

// ---------- CATEGORIES ----------
export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (error) falhar(error, "products");
    return data ?? [];
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ name: z.string().trim().min(1).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createCategory", 40);
    const { data: row, error } = await context.supabase
      .from("categories")
      .insert({ name: data.name, user_id: context.userId })
      .select("id, name")
      .single();
    if (error) falhar(error, "products");
    return row;
  });

// ---------- SUPPLIERS ----------
export const listSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("suppliers")
      .select("id, name")
      .order("name");
    if (error) falhar(error, "products");
    return data ?? [];
  });

// ---------- PRODUCTS ----------
export const productSchema = z.object({
  sku: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  barcode: z.string().max(64).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  cost_cents: z.number().int().min(0),
  price_cents: z.number().int().min(0),
  stock_qty: z.number().int().min(0),
  min_stock: z.number().int().min(0),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  active: z.boolean().default(true),
});

export const listProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "id, sku, name, description, barcode, cost_cents, price_cents, stock_qty, min_stock, image_url, active, category_id, supplier_id, categories(name), suppliers(name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) falhar(error, "products");
    return data ?? [];
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createProduct", 40);
    const payload = { ...data, user_id: context.userId, image_url: data.image_url || null };
    const { data: row, error } = await context.supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();
    if (error) falhar(error, "products");
    return row;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: productSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch = { ...data.patch };
    if (patch.image_url === "") patch.image_url = null;
    const { error } = await context.supabase
      .from("products")
      .update(patch)
      .eq("id", data.id);
    if (error) falhar(error, "products");
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) falhar(error, "products");
    return { ok: true };
  });

// ---------- STOCK MOVEMENTS ----------
export const listMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stock_movements")
      .select("id, product_id, move_type, qty, note, created_at, products(name, sku)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) falhar(error, "products");
    return data ?? [];
  });

export const createMovement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        product_id: z.string().uuid(),
        move_type: z.enum(["in", "out", "adjust"]),
        qty: z.number().int().min(0),
        note: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createMovement", 60);
    const { error } = await context.supabase
      .from("stock_movements")
      .insert({ ...data, user_id: context.userId });
    if (error) falhar(error, "products");
    return { ok: true };
  });

// ---------- DASHBOARD ----------
export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: products, error } = await context.supabase
      .from("products")
      .select("cost_cents, price_cents, stock_qty, min_stock, active")
      .is("deleted_at", null);
    if (error) falhar(error, "products");


    const list = products ?? [];
    const totalSkus = list.length;
    const activeSkus = list.filter((p) => p.active).length;
    const totalUnits = list.reduce((a, p) => a + p.stock_qty, 0);
    const stockValueCents = list.reduce((a, p) => a + p.stock_qty * p.cost_cents, 0);
    const potentialRevenueCents = list.reduce((a, p) => a + p.stock_qty * p.price_cents, 0);
    const potentialProfitCents = potentialRevenueCents - stockValueCents;
    const lowStock = list.filter((p) => p.stock_qty <= p.min_stock && p.active).length;
    const outOfStock = list.filter((p) => p.stock_qty === 0 && p.active).length;

    const { data: recentMoves } = await context.supabase
      .from("stock_movements")
      .select("id, move_type, qty, created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(8);

    return {
      totalSkus,
      activeSkus,
      totalUnits,
      stockValueCents,
      potentialRevenueCents,
      potentialProfitCents,
      lowStock,
      outOfStock,
      recentMoves: recentMoves ?? [],
    };
  });
