import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { resolveItens, totalCents } from "@/lib/pedidos-calc";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { withCapture } from "@/lib/observability.server";



const PEDIDO_STATUS = ["novo", "separacao", "expedicao", "entregue", "cancelado"] as const;
const PEDIDO_CANAL = ["site", "whatsapp", "marketplace", "loja", "outro"] as const;

const itemSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  descricao_snapshot: z.string().trim().min(1).max(240),
  qty: z.number().int().min(1),
  unit_price_cents: z.number().int().min(0),
});

export const listPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("pedidos")
      .select(
        "id, numero, cliente_id, cliente_nome_snapshot, vendedor_nome, status, canal, total_cents, notes, created_at, clientes(nome)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPedido = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: pedido, error } = await context.supabase
      .from("pedidos")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: itens } = await context.supabase
      .from("pedido_itens")
      .select("id, product_id, descricao_snapshot, qty, unit_price_cents, subtotal_cents")
      .eq("pedido_id", data.id);
    return { pedido, itens: itens ?? [] };
  });

export const createPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        cliente_id: z.string().uuid().optional().nullable(),
        cliente_nome_snapshot: z.string().max(200).optional().nullable(),
        status: z.enum(PEDIDO_STATUS).default("novo"),
        canal: z.enum(PEDIDO_CANAL).default("site"),
        notes: z.string().max(2000).optional().nullable(),
        vendedor_id: z.string().uuid().optional().nullable(),
        vendedor_nome: z.string().trim().max(120).optional().nullable(),
        itens: z.array(itemSchema).min(1),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await enforceRateLimit(context.supabase, context.userId, "createPedido", 30);
    return withCapture("createPedido", context.userId, async () => {
      // Buscar preços reais dos produtos vinculados — nunca confiar no price do payload.
      const productIds = Array.from(
        new Set(data.itens.map((it) => it.product_id).filter((v): v is string => !!v)),
      );
      const priceMap = new Map<string, { price_cents: number; name: string; sku: string }>();
      if (productIds.length > 0) {
        const { data: prods, error: pErr } = await context.supabase
          .from("products")
          .select("id, price_cents, name, sku")
          .in("id", productIds)
          .is("deleted_at", null);
        if (pErr) throw new Error(pErr.message);
        for (const p of prods ?? []) {
          priceMap.set(p.id, { price_cents: p.price_cents, name: p.name, sku: p.sku });
        }
      }

      // Preço autoritativo do servidor para itens com produto; avulsos usam o informado.
      const resolvedItens = resolveItens(data.itens, priceMap);
      const total_cents = totalCents(resolvedItens);

      // Vendedor escolhido na lista: o nome oficial vem do cadastro, nunca do payload.
      let vendedorNome: string | null = data.vendedor_nome || null;
      if (data.vendedor_id) {
        const { data: vend, error: vErr } = await context.supabase
          .from("vendedores")
          .select("nome")
          .eq("id", data.vendedor_id)
          .eq("user_id", context.userId)
          .is("deleted_at", null)
          .maybeSingle();
        if (vErr) throw new Error(vErr.message);
        if (!vend) throw new Error("Vendedor não encontrado. Atualize a página e tente de novo.");
        vendedorNome = vend.nome;
      }

      const { data: pedido, error } = await context.supabase
        .from("pedidos")
        .insert({
          user_id: context.userId,
          numero: 0,
          cliente_id: data.cliente_id ?? null,
          cliente_nome_snapshot: data.cliente_nome_snapshot ?? null,
          status: data.status,
          canal: data.canal,
          notes: data.notes ?? null,
          // vendedor_id só vai quando escolhido: assim criar pedido sem vendedor
          // continua funcionando mesmo antes de rodar o SQL dos vendedores.
          ...(data.vendedor_id ? { vendedor_id: data.vendedor_id } : {}),
          vendedor_nome: vendedorNome,
          total_cents,
        })
        .select("id, numero")
        .single();
      if (error) throw new Error(error.message);

      const rows = resolvedItens.map((it) => ({
        user_id: context.userId,
        pedido_id: pedido.id,
        product_id: it.product_id,
        descricao_snapshot: it.descricao_snapshot,
        qty: it.qty,
        unit_price_cents: it.unit_price_cents,
        subtotal_cents: it.qty * it.unit_price_cents,
      }));
      const { error: iErr } = await context.supabase.from("pedido_itens").insert(rows);
      if (iErr) throw new Error(iErr.message);
      return pedido;
    });
  });


export const updatePedidoStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(PEDIDO_STATUS) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pedidos")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("pedidos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
