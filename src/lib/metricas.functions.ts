import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MetricasNegocio = {
  ticketMedio: number | null;
  margemPct: number | null;
  cacCents: number | null;
  ltvCents: number | null;
  ltvSobreCac: number | null;
  roasX: number | null;
  roiPct: number | null;
  arpuCents: number | null;
  churnPct: number | null;
  totalClientes: number;
  clientesNovos30d: number;
  totalPedidos: number;
};

const DIAS_JANELA_CHURN = 60;

export const getMetricasNegocio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MetricasNegocio> => {
    const [clientesRes, pedidosRes, campanhasRes, financeiroRes] = await Promise.all([
      context.supabase.from("clientes").select("id, created_at").is("deleted_at", null),
      context.supabase
        .from("pedidos")
        .select("id, cliente_id, total_cents, status, created_at")
        .is("deleted_at", null)
        .neq("status", "cancelado"),
      context.supabase.from("campanhas").select("gasto_cents, receita_cents").is("deleted_at", null),
      context.supabase
        .from("financeiro_lancamentos")
        .select("tipo, valor_cents, status")
        .is("deleted_at", null)
        .eq("status", "pago"),
    ]);

    const clientes = clientesRes.data ?? [];
    const pedidos = pedidosRes.data ?? [];
    const campanhas = campanhasRes.data ?? [];
    const financeiro = financeiroRes.data ?? [];

    const totalClientes = clientes.length;
    const totalPedidos = pedidos.length;

    // Ticket médio — precisa de pelo menos 1 pedido
    const ticketMedio =
      totalPedidos > 0 ? pedidos.reduce((a, p) => a + p.total_cents, 0) / totalPedidos : null;

    // Margem — precisa de receita paga registrada no financeiro
    const receitaPaga = financeiro.filter((f) => f.tipo === "receita").reduce((a, f) => a + f.valor_cents, 0);
    const despesaPaga = financeiro.filter((f) => f.tipo === "despesa").reduce((a, f) => a + f.valor_cents, 0);
    const margemPct = receitaPaga > 0 ? ((receitaPaga - despesaPaga) / receitaPaga) * 100 : null;

    // Clientes novos nos últimos 30 dias — base pro CAC
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const clientesNovos30d = clientes.filter((c) => new Date(c.created_at) >= cutoff30).length;

    // CAC — precisa de investimento em marketing E de cliente novo no período
    const gastoTotalMkt = campanhas.reduce((a, c) => a + c.gasto_cents, 0);
    const cacCents = gastoTotalMkt > 0 && clientesNovos30d > 0 ? gastoTotalMkt / clientesNovos30d : null;

    // LTV — receita média por cliente que já comprou (aproximação simples,
    // sem projeção de tempo de vida — só o que já foi vendido de verdade)
    const clientesComPedido = new Set(pedidos.map((p) => p.cliente_id).filter(Boolean));
    const receitaTotalPedidos = pedidos.reduce((a, p) => a + p.total_cents, 0);
    const ltvCents = clientesComPedido.size > 0 ? receitaTotalPedidos / clientesComPedido.size : null;

    const ltvSobreCac = ltvCents !== null && cacCents !== null && cacCents > 0 ? ltvCents / cacCents : null;

    // ROAS/ROI — precisa de campanha com gasto registrado
    const receitaTotalMkt = campanhas.reduce((a, c) => a + c.receita_cents, 0);
    const roasX = gastoTotalMkt > 0 ? receitaTotalMkt / gastoTotalMkt : null;
    const roiPct = gastoTotalMkt > 0 ? ((receitaTotalMkt - gastoTotalMkt) / gastoTotalMkt) * 100 : null;

    // ARPU — receita total dividida pelos clientes que já compraram
    const arpuCents = clientesComPedido.size > 0 ? receitaTotalPedidos / clientesComPedido.size : null;

    // Churn — dos clientes que já compraram alguma vez, quantos não compram
    // faz mais de 60 dias (aproximação simples de "cliente que sumiu")
    let churnPct: number | null = null;
    if (clientesComPedido.size > 0) {
      const ultimaCompraPorCliente = new Map<string, string>();
      for (const p of pedidos) {
        if (!p.cliente_id) continue;
        const atual = ultimaCompraPorCliente.get(p.cliente_id);
        if (!atual || p.created_at > atual) ultimaCompraPorCliente.set(p.cliente_id, p.created_at);
      }
      const cutoffChurn = new Date();
      cutoffChurn.setDate(cutoffChurn.getDate() - DIAS_JANELA_CHURN);
      const inativos = Array.from(ultimaCompraPorCliente.values()).filter((d) => new Date(d) < cutoffChurn).length;
      churnPct = (inativos / clientesComPedido.size) * 100;
    }

    return {
      ticketMedio,
      margemPct,
      cacCents,
      ltvCents,
      ltvSobreCac,
      roasX,
      roiPct,
      arpuCents,
      churnPct,
      totalClientes,
      clientesNovos30d,
      totalPedidos,
    };
  });
