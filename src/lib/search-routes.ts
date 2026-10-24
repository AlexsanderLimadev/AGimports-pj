export type SearchRoute = { keywords: string[]; path: string; label: string };

/**
 * Cada módulo real do app, com as palavras que devem levar até ele.
 * Adicionar um módulo novo? Só acrescentar uma linha aqui — tanto a busca
 * da landing quanto a busca dentro do app usam essa mesma lista.
 */
export const APP_SEARCH_ROUTES: SearchRoute[] = [
  { path: "/app", label: "Dashboard", keywords: ["dashboard", "painel", "inicio", "home", "resumo", "visao geral"] },
  { path: "/app/produtos", label: "Produtos", keywords: ["produto", "produtos", "catalogo", "sku", "item", "itens"] },
  { path: "/app/estoque", label: "Estoque", keywords: ["estoque", "inventario", "movimentacao", "movimentacoes"] },
  { path: "/app/fornecedores", label: "Fornecedores", keywords: ["fornecedor", "fornecedores", "supplier", "compra", "compras"] },
  { path: "/app/pedidos", label: "Pedidos", keywords: ["pedido", "pedidos", "venda", "vendas", "kanban", "encomenda"] },
  { path: "/app/funis", label: "Funis de venda", keywords: ["funil", "funis", "funil de venda", "funis de venda"] },
  { path: "/app/calculadora", label: "Calculadora", keywords: ["calculadora", "preco", "precificacao", "margem", "simulacao", "simulador"] },
  { path: "/app/clientes", label: "Clientes", keywords: ["cliente", "clientes", "crm", "contato", "contatos"] },
  { path: "/app/agenda", label: "Agenda", keywords: ["agenda", "evento", "eventos", "compromisso", "calendario"] },
  { path: "/app/marketing", label: "Marketing", keywords: ["marketing", "campanha", "campanhas", "canal", "canais"] },
  { path: "/app/automacoes", label: "Automações", keywords: ["automacao", "automacoes", "regra", "regras"] },
  { path: "/app/metas", label: "Metas", keywords: ["meta", "metas", "objetivo", "objetivos"] },
  { path: "/app/metricas", label: "Métricas de Negócio", keywords: ["metrica", "metricas", "cac", "ltv", "roi", "roas", "churn", "arpu", "indicador de negocio"] },
  { path: "/app/dashboard-analitico", label: "Dashboard Analítico", keywords: ["dashboard analitico", "analitico", "vendedor", "vendedores", "ranking", "faturamento", "mais vendido", "insights", "pdf"] },
  { path: "/app/alertas", label: "Alertas de Negócio", keywords: ["alerta", "alertas", "margem baixa", "estoque parado", "reposicao", "repor", "parado", "aviso", "avisos"] },
  { path: "/app/bi", label: "BI", keywords: ["bi", "indicador", "indicadores", "business intelligence", "analise", "analises"] },
  { path: "/app/financeiro", label: "Financeiro", keywords: ["financeiro", "financas", "caixa", "lancamento", "lancamentos", "receita", "despesa"] },
  { path: "/app/relatorios", label: "Relatórios", keywords: ["relatorio", "relatorios", "exportar", "export", "csv"] },
  { path: "/app/configuracoes", label: "Configurações", keywords: ["configuracao", "configuracoes", "ajuste", "ajustes", "settings", "perfil"] },
];

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acento, pra "preço" bater com "preco"
}

/**
 * Acha o módulo que bate com o que a pessoa digitou. Aceita erro de
 * acentuação e busca parcial ("pedid" já acha "Pedidos"), mas retorna
 * null se não bater com nada real — quem chama decide o que fazer com
 * isso (mostrar erro, não navegar sozinho pra qualquer lugar).
 */
export function resolveSearch(query: string): SearchRoute | null {
  const q = normalize(query);
  if (!q) return null;

  // 1) match exato de alguma palavra-chave
  for (const route of APP_SEARCH_ROUTES) {
    if (route.keywords.some((kw) => normalize(kw) === q)) return route;
  }
  // 2) a busca contém uma palavra-chave inteira (ex: "ver pedidos" -> "pedidos")
  for (const route of APP_SEARCH_ROUTES) {
    if (route.keywords.some((kw) => q.includes(normalize(kw)))) return route;
  }
  // 3) uma palavra-chave começa com o que foi digitado (ex: "pedid" -> "pedidos")
  for (const route of APP_SEARCH_ROUTES) {
    if (route.keywords.some((kw) => normalize(kw).startsWith(q) && q.length >= 3)) return route;
  }
  return null;
}
