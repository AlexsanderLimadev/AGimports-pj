import type { AnaliseNegocio } from "@/lib/analise.functions";

export type Insight = {
  tipo: "alerta" | "oportunidade" | "positivo";
  texto: string;
};

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

export function gerarInsights(a: AnaliseNegocio): Insight[] {
  const out: Insight[] = [];

  if (a.mesVariacaoPct !== null) {
    const v = a.mesVariacaoPct;
    if (v <= -10) {
      out.push({
        tipo: "alerta",
        texto: `O faturamento do mês caiu ${Math.abs(v).toFixed(1)}% em relação ao mês passado (${brl(a.mesAnteriorCents)} para ${brl(a.mesAtualCents)}). Vale revisar campanhas e follow-up de clientes.`,
      });
    } else if (v >= 10) {
      out.push({
        tipo: "positivo",
        texto: `O faturamento do mês cresceu ${v.toFixed(1)}% em relação ao mês passado. Identifique o que funcionou e repita.`,
      });
    }
  }

  if (a.roiPct !== null) {
    if (a.roiPct < 20) {
      out.push({
        tipo: "alerta",
        texto: `O ROI está em ${a.roiPct.toFixed(1)}%, abaixo de 20%. Revise os preços de venda ou negocie melhor custo com o fornecedor.`,
      });
    } else if (a.roiPct >= 50) {
      out.push({
        tipo: "positivo",
        texto: `O ROI está em ${a.roiPct.toFixed(1)}%, um retorno saudável sobre o que foi investido em produto.`,
      });
    }
  }

  if (a.maisVendido && a.receitaTotalCents > 0) {
    const share = (a.maisVendido.receitaCents / a.receitaTotalCents) * 100;
    if (share >= 40) {
      out.push({
        tipo: "alerta",
        texto: `"${a.maisVendido.nome}" responde por ${share.toFixed(0)}% da receita. Dependência alta de um único produto é risco: considere diversificar.`,
      });
    }
  }

  if (a.menosVendido && a.maisVendido && a.menosVendido.nome !== a.maisVendido.nome) {
    out.push({
      tipo: "oportunidade",
      texto: `"${a.menosVendido.nome}" tem a menor saída (${a.menosVendido.qtd} un.). Considere uma promoção ou combo pra girar esse item.`,
    });
  }

  if (a.produtosSemVenda.length > 0 && a.totalPedidos > 0) {
    const nomes = a.produtosSemVenda.slice(0, 3).map((p) => `"${p.nome}"`).join(", ");
    const resto = a.produtosSemVenda.length > 3 ? ` e mais ${a.produtosSemVenda.length - 3}` : "";
    out.push({
      tipo: "oportunidade",
      texto: `${a.produtosSemVenda.length} produto(s) ativo(s) ainda sem nenhuma venda: ${nomes}${resto}. Vale divulgar ou revisar preço.`,
    });
  }

  if (a.vendedorTop && a.vendedorBottom && a.vendedorTop.totalCents > 0) {
    const ratio = a.vendedorBottom.totalCents / a.vendedorTop.totalCents;
    if (ratio < 0.5) {
      out.push({
        tipo: "alerta",
        texto: `${a.vendedorBottom.nome} vendeu menos da metade de ${a.vendedorTop.nome} (${brl(a.vendedorBottom.totalCents)} contra ${brl(a.vendedorTop.totalCents)}). Considere alinhar técnicas de conversão entre os dois.`,
      });
    }
  }

  return out;
}
