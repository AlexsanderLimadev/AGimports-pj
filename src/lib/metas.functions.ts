import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit.server";

const META_TIPOS = ["faturamento", "pedidos", "clientes", "lucro", "ticket_medio"] as const;
const META_PERIODOS = ["mes", "trimestre", "ano"] as const;

const metaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  tipo: z.enum(META_TIPOS),
  periodo: z.enum(META_PERIODOS).default("mes"),
  alvo: z.number().min(0),
  starts_at: z.string(),
  ends_at: z.string().optional().nullable(),
});

function periodEnd(starts: string, periodo: "mes" | "trimestre" | "ano") {
  const d = new Date(starts);
  if (periodo === "mes") d.setMonth(d.getMonth() + 1);
  else if (periodo === "trimestre") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export const listMetas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("metas")
      .select("id, nome, tipo, periodo, alvo, atual, starts_at, ends_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);


    // Compute atual dynamically from real data
    const enriched = await Promise.all(
      (data ?? []).map(async (m) => {
        const from = m.starts_at;
        const to = m.ends_at || periodEnd(m.starts_at, m.periodo);
        let atual = 0;
        if (m.tipo === "faturamento" || m.tipo === "pedidos" || m.tipo === "ticket_medio") {
          const { data: pedidos } = await context.supabase
            .from("pedidos")
            .select("total_cents")
            .is("deleted_at", null)
            .gte("created_at", from)
            .lt("created_at", to)
            .neq("status", "cancelado");
          const total = (pedidos ?? []).reduce((a, p) => a + p.total_cents, 0);
          if (m.tipo === "faturamento") atual = total / 100;
          else if (m.tipo === "pedidos") atual = pedidos?.length ?? 0;
          else atual = pedidos && pedidos.length ? total / 100 / pedidos.length : 0;
        } else if (m.tipo === "clientes") {
          const { count } = await context.supabase
            .from("clientes")
            .select("id", { count: "exact", head: true })
            .is("deleted_at", null)
            .gte("created_at", from)
            .lt("created_at", to);
          atual = count ?? 0;
        } else if (m.tipo === "lucro") {
          const { data: rec } = await context.supabase
            .from("financeiro_lancamentos")
            .select("tipo, valor_cents")
            .is("deleted_at", null)
            .gte("data", from)
            .lt("data", to)
            .eq("status", "pago");
          const receitas = (rec ?? [])
            .filter((r) => r.tipo === "receita")
            .reduce((a, r) => a + r.valor_cents, 0);
          const despesas = (rec ?? [])
            .filter((r) => r.tipo === "despesa")
            .reduce((a, r) => a + r.valor_cents, 0);
          atual = (receitas - despesas) / 100;
        }
        return { ...m, atual };
      }),
    );
    return enriched;
  });

export const createMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => metaSchema.parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createMeta", 40);
    const { data: row, error } = await context.supabase
      .from("metas")
      .insert({ ...data, user_id: context.userId, atual: 0 })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: metaSchema.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("metas").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("metas")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
