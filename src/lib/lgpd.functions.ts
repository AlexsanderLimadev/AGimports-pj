import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { withCapture } from "@/lib/observability.server";

const idInput = (d: unknown) => z.object({ cliente_id: z.string().uuid() }).parse(d);

/**
 * LGPD — Portabilidade (art. 18, V).
 * Exporta todos os dados pessoais e transacionais de um cliente específico.
 */
export const exportClienteData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(idInput)
  .handler(async ({ data, context }) =>
    withCapture("exportClienteData", context.userId, async () => {
      const { data: cliente, error } = await context.supabase
        .from("clientes")
        .select("*")
        .eq("id", data.cliente_id)
        .single();
      if (error) throw new Error(error.message);

      const [{ data: pedidos }, { data: itens }, { data: eventos }, { data: lancamentos }] =
        await Promise.all([
          context.supabase
            .from("pedidos")
            .select("id, numero, status, canal, total_cents, notes, created_at")
            .eq("cliente_id", data.cliente_id),
          context.supabase
            .from("pedido_itens")
            .select("pedido_id, descricao_snapshot, qty, unit_price_cents, subtotal_cents")
            .in(
              "pedido_id",
              (
                await context.supabase
                  .from("pedidos")
                  .select("id")
                  .eq("cliente_id", data.cliente_id)
              ).data?.map((p) => p.id) ?? ["00000000-0000-0000-0000-000000000000"],
            ),
          context.supabase
            .from("eventos")
            .select("id, titulo, tipo, status, starts_at, ends_at")
            .eq("cliente_id", data.cliente_id),
          context.supabase
            .from("financeiro_lancamentos")
            .select("id, tipo, descricao, valor_cents, data, status, pedido_id")
            .in(
              "pedido_id",
              (
                await context.supabase
                  .from("pedidos")
                  .select("id")
                  .eq("cliente_id", data.cliente_id)
              ).data?.map((p) => p.id) ?? ["00000000-0000-0000-0000-000000000000"],
            ),
        ]);

      return {
        gerado_em: new Date().toISOString(),
        titular: cliente,
        pedidos: pedidos ?? [],
        itens_de_pedido: itens ?? [],
        eventos: eventos ?? [],
        lancamentos_financeiros: lancamentos ?? [],
      };
    }),
  );

/**
 * LGPD — Eliminação (art. 18, VI) com preservação de integridade fiscal/contábil.
 * Anonimiza os dados pessoais do cliente, mantendo os pedidos e lançamentos já
 * emitidos (obrigação legal de guarda), sem qualquer dado identificável.
 */
export const anonymizeCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(idInput)
  .handler(async ({ data, context }) =>
    withCapture("anonymizeCliente", context.userId, async () => {
      const anonId = data.cliente_id.slice(0, 8);
      const anonName = `Titular anonimizado ${anonId}`;

      const { error } = await context.supabase
        .from("clientes")
        .update({
          nome: anonName,
          email: null,
          telefone: null,
          documento: null,
          notes: null,
          tags: ["anonimizado"],
          deleted_at: new Date().toISOString(),
        })
        .eq("id", data.cliente_id);
      if (error) throw new Error(error.message);

      // Remove o nome pessoal congelado nos pedidos, preservando os valores.
      const { error: pErr } = await context.supabase
        .from("pedidos")
        .update({ cliente_nome_snapshot: anonName, notes: null })
        .eq("cliente_id", data.cliente_id);
      if (pErr) throw new Error(pErr.message);

      // Remove vínculos pessoais na agenda.
      const { error: eErr } = await context.supabase
        .from("eventos")
        .update({ descricao: null })
        .eq("cliente_id", data.cliente_id);
      if (eErr) throw new Error(eErr.message);

      return { ok: true, anonimizado_como: anonName };
    }),
  );
