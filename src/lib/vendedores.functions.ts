import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { normalizarNome, resumirPorVendedor } from "@/lib/vendedores-calc";
import { falhar } from "@/lib/erros.server";

const nomeSchema = z
  .string()
  .transform(normalizarNome)
  .pipe(z.string().min(1, "Informe o nome do vendedor").max(120, "Nome muito longo"));

function traduzirErro(error: { code?: string; message: string }): Error {
  if (error.code === "23505") return new Error("Já existe um vendedor com esse nome.");
  if (error.message.includes("vendedores")) {
    return new Error("A tabela de vendedores ainda não existe no banco. Rode o SQL 20261024_vendedores.sql no Supabase.");
  }
  return new Error(error.message);
}

export const listVendedores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [vRes, pRes] = await Promise.all([
      context.supabase
        .from("vendedores")
        .select("id, nome, ativo, created_at")
        .is("deleted_at", null)
        .order("nome", { ascending: true })
        .limit(500),
      context.supabase
        .from("pedidos")
        .select("vendedor_id, total_cents")
        .is("deleted_at", null)
        .neq("status", "cancelado")
        .not("vendedor_id", "is", null),
    ]);
    if (vRes.error) throw traduzirErro(vRes.error);
    const resumo = resumirPorVendedor(pRes.data ?? []);
    return (vRes.data ?? []).map((v) => ({
      ...v,
      pedidos: resumo.get(v.id)?.pedidos ?? 0,
      totalCents: resumo.get(v.id)?.totalCents ?? 0,
    }));
  });

export const createVendedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ nome: nomeSchema }).parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createVendedor", 40);
    const { data: row, error } = await context.supabase
      .from("vendedores")
      .insert({ user_id: context.userId, nome: data.nome })
      .select("id")
      .single();
    if (error) throw traduzirErro(error);
    return row;
  });

export const updateVendedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z.object({ id: z.string().uuid(), nome: nomeSchema.optional(), ativo: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "updateVendedor", 60);
    const patch: { nome?: string; ativo?: boolean } = {};
    if (data.nome !== undefined) patch.nome = data.nome;
    if (data.ativo !== undefined) patch.ativo = data.ativo;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await context.supabase
      .from("vendedores")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("deleted_at", null);
    if (error) throw traduzirErro(error);

    // Renomeou: acerta o nome guardado nos pedidos desse vendedor, para o
    // ranking do Dashboard Analítico continuar somando tudo numa pessoa só.
    if (patch.nome !== undefined) {
      const { error: pErr } = await context.supabase
        .from("pedidos")
        .update({ vendedor_nome: patch.nome })
        .eq("vendedor_id", data.id)
        .eq("user_id", context.userId);
      if (pErr) falhar(pErr, "vendedores");
    }
    return { ok: true };
  });

/** Remove do cadastro. Os pedidos antigos continuam com o nome gravado neles. */
export const deleteVendedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "deleteVendedor", 60);
    const { error } = await context.supabase
      .from("vendedores")
      .update({ deleted_at: new Date().toISOString(), ativo: false })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw traduzirErro(error);
    return { ok: true };
  });
