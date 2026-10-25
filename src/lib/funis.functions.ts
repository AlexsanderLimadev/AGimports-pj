import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function nextColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || `funil-${Date.now()}`
  );
}

const etapaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  pessoas: z.number().int().min(0).default(0),
  conv: z.number().min(0).max(100).default(0),
  valor_cents: z.number().int().min(0).default(0),
  cor: z.string().max(80).optional().nullable(),
});

export const listFunis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: funis, error } = await context.supabase
      .from("funis")
      .select("id, nome, slug, created_at, funil_etapas(id, ordem, nome, pessoas, conv, valor_cents, cor)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (funis ?? []).map((f) => ({
      ...f,
      etapas: (f.funil_etapas ?? []).sort(
        (a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem,
      ),
    }));
  });

export const getFunil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: funil, error } = await context.supabase
      .from("funis")
      .select("id, nome, slug")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: etapas } = await context.supabase
      .from("funil_etapas")
      .select("id, ordem, nome, pessoas, conv, valor_cents, cor")
      .eq("funil_id", data.id)
      .order("ordem", { ascending: true });
    return { ...funil, etapas: etapas ?? [] };
  });

export const createFunil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        nome: z.string().trim().min(1).max(120),
        etapas: z.array(etapaSchema).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createFunil", 30);
    // Sufixo curto garante que criar o mesmo template (ou o mesmo nome de
    // funil) mais de uma vez nunca esbarra na trava de "nome único por
    // usuário" do banco — antes disso travava com um erro técnico feio.
    const slug = `${slugify(data.nome)}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: funil, error } = await context.supabase
      .from("funis")
      .insert({ user_id: context.userId, nome: data.nome, slug })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    if (data.etapas.length) {
      const rows = data.etapas.map((e, i) => ({
        user_id: context.userId,
        funil_id: funil.id,
        ordem: i,
        nome: e.nome,
        pessoas: e.pessoas,
        conv: e.conv,
        valor_cents: e.valor_cents,
        cor: e.cor ?? nextColor(i),
      }));
      const { error: eErr } = await context.supabase.from("funil_etapas").insert(rows);
      if (eErr) throw new Error(eErr.message);
    }
    return funil;
  });

export const updateFunil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), nome: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("funis")
      .update({ nome: data.nome })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFunil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("funis")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ funil_id: z.string().uuid(), etapa: etapaSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { count } = await context.supabase
      .from("funil_etapas")
      .select("id", { count: "exact", head: true })
      .eq("funil_id", data.funil_id);
    const ordem = count ?? 0;
    const { error } = await context.supabase.from("funil_etapas").insert({
      user_id: context.userId,
      funil_id: data.funil_id,
      ordem,
      nome: data.etapa.nome,
      pessoas: data.etapa.pessoas,
      conv: data.etapa.conv,
      valor_cents: data.etapa.valor_cents,
      cor: data.etapa.cor ?? nextColor(ordem),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: etapaSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("funil_etapas")
      .update(data.patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEtapa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("funil_etapas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
