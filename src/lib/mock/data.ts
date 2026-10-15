// Deterministic mock data for AG Tech ERP
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a));

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const num = (n: number) => n.toLocaleString("pt-BR");
export const pct = (n: number) => `${n.toFixed(1)}%`;

export const kpis = {
  faturamentoHoje: 24837.5,
  faturamentoMes: 487239.9,
  crescimento: 18.4,
  lucroLiquido: 132480.2,
  produtosVendidos: 1284,
  novosClientes: 187,
  ticketMedio: 289.4,
  roiMarketing: 412.5,
  cac: 42.1,
  ltv: 1845,
  margemLiquida: 27.2,
  margemBruta: 58.4,
  estoqueTotal: 8420,
  valorEstoque: 384210,
  produtosSemGiro: 42,
  pedidosPendentes: 38,
  pedidosEnviados: 214,
  pedidosCancelados: 12,
  taxaConversao: 3.8,
  clientesAtivos: 1284,
  clientesInativos: 342,
  investidoAnuncios: 32120,
  lucroAposAnuncios: 100360,
};

export const faturamentoDiario = Array.from({ length: 30 }, (_, i) => ({
  dia: `${i + 1}`,
  receita: between(8000, 32000),
  despesa: between(3000, 14000),
}));

export const faturamentoMensal = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
].map((m) => ({
  mes: m,
  receita: between(180000, 520000),
  lucro: between(40000, 160000),
  meta: 400000,
}));

export const topProdutos = [
  { nome: "Camisa Oversized Off-White", vendas: 328, receita: 41230 },
  { nome: "Jaqueta Bomber Importada", vendas: 214, receita: 78400 },
  { nome: "Tênis Chunky Sneaker", vendas: 187, receita: 92140 },
  { nome: "Calça Wide Cargo", vendas: 165, receita: 33280 },
  { nome: "Moletom Essentials", vendas: 142, receita: 28400 },
];

export const canais = [
  { canal: "Shopify", vendas: 184000, cor: "var(--color-chart-1)" },
  { canal: "Instagram", vendas: 132000, cor: "var(--color-chart-2)" },
  { canal: "Mercado Livre", vendas: 94000, cor: "var(--color-chart-3)" },
  { canal: "Shopee", vendas: 48000, cor: "var(--color-chart-4)" },
  { canal: "WhatsApp", vendas: 29000, cor: "var(--color-chart-5)" },
];

const marcas = ["Nike", "Adidas", "Off-White", "Essentials", "Stussy", "Palace"];
const categorias = ["Camisas", "Jaquetas", "Calças", "Tênis", "Acessórios", "Moletons"];
const tamanhos = ["P", "M", "G", "GG"];
const cores = ["Preto", "Branco", "Bege", "Verde", "Cinza"];

export const produtos = Array.from({ length: 32 }, (_, i) => {
  const custo = between(45, 380);
  const preco = Math.round(custo * (1.8 + rand() * 1.4));
  return {
    id: `SKU-${1000 + i}`,
    nome: `${pick(categorias).slice(0, -1)} ${pick(marcas)} ${pick(cores)}`,
    marca: pick(marcas),
    categoria: pick(categorias),
    tamanho: pick(tamanhos),
    cor: pick(cores),
    estoque: between(0, 240),
    minimo: 10,
    custo,
    preco,
    vendidos: between(0, 320),
    curva: pick(["A", "B", "C"]) as "A" | "B" | "C",
  };
});

const nomes = [
  "Ana Souza",
  "Bruno Lima",
  "Carla Mendes",
  "Diego Alves",
  "Elisa Ramos",
  "Felipe Costa",
  "Gabriela Torres",
  "Hugo Martins",
  "Isabela Rocha",
  "João Pereira",
  "Kelly Barros",
  "Lucas Freitas",
  "Marina Dias",
  "Nathan Silva",
  "Olívia Prado",
  "Paulo Nunes",
];

export const clientes = Array.from({ length: 24 }, (_, i) => ({
  id: `CLI-${100 + i}`,
  nome: pick(nomes),
  email: `cliente${i}@agimports.com`,
  telefone: `(11) 9${between(1000, 9999)}-${between(1000, 9999)}`,
  cidade: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre"]),
  totalGasto: between(300, 18000),
  pedidos: between(1, 28),
  ticket: between(120, 850),
  classificacao: pick(["VIP", "Atacado", "Varejo"]) as "VIP" | "Atacado" | "Varejo",
  ultimaCompra: `${between(1, 28)}/11/2026`,
}));

const statusPedido = ["Novo", "Separação", "Expedição", "Entregue", "Cancelado"] as const;
export const pedidos = Array.from({ length: 28 }, (_, i) => ({
  id: `#${8420 + i}`,
  cliente: pick(nomes),
  itens: between(1, 6),
  total: between(180, 2400),
  status: statusPedido[between(0, statusPedido.length)],
  canal: pick(["Shopify", "Instagram", "WhatsApp", "Mercado Livre"]),
  data: `${between(1, 28)}/11`,
}));

export const campanhas = [
  { canal: "Google Ads", invest: 8420, cliques: 12400, ctr: 3.2, roas: 4.8, receita: 40416 },
  { canal: "Meta Ads", invest: 12200, cliques: 21800, ctr: 2.4, roas: 5.4, receita: 65880 },
  { canal: "TikTok Ads", invest: 6800, cliques: 18400, ctr: 4.1, roas: 3.9, receita: 26520 },
  { canal: "Shopee Ads", invest: 3200, cliques: 8420, ctr: 5.2, roas: 6.1, receita: 19520 },
  { canal: "Mercado Livre Ads", invest: 4100, cliques: 6210, ctr: 2.8, roas: 4.2, receita: 17220 },
  { canal: "Influenciadores", invest: 9800, cliques: 32000, ctr: 6.4, roas: 3.2, receita: 31360 },
];

export const funis = [
  {
    id: "principal",
    nome: "Funil Principal — Shopify",
    etapas: [
      { nome: "Visitantes", pessoas: 12400, conv: 100, valor: 0, cor: "var(--color-chart-2)" },
      { nome: "Cliques", pessoas: 4820, conv: 38.9, valor: 0, cor: "var(--color-chart-2)" },
      { nome: "Leads", pessoas: 1240, conv: 25.7, valor: 0, cor: "var(--color-chart-1)" },
      { nome: "Carrinho", pessoas: 620, conv: 50, valor: 148000, cor: "var(--color-chart-4)" },
      { nome: "Checkout", pessoas: 380, conv: 61.3, valor: 92000, cor: "var(--color-chart-4)" },
      { nome: "Compra", pessoas: 214, conv: 56.3, valor: 62240, cor: "var(--color-chart-1)" },
      { nome: "Fidelização", pessoas: 78, conv: 36.4, valor: 24800, cor: "var(--color-chart-3)" },
    ],
  },
  {
    id: "whatsapp",
    nome: "Funil Atacado — WhatsApp",
    etapas: [
      { nome: "Contatos", pessoas: 840, conv: 100, valor: 0, cor: "var(--color-chart-2)" },
      { nome: "Qualificados", pessoas: 320, conv: 38.1, valor: 0, cor: "var(--color-chart-1)" },
      { nome: "Orçamento", pessoas: 148, conv: 46.3, valor: 240000, cor: "var(--color-chart-4)" },
      { nome: "Fechados", pessoas: 62, conv: 41.9, valor: 118400, cor: "var(--color-chart-1)" },
    ],
  },
];

export const contas = Array.from({ length: 12 }, (_, i) => ({
  id: `FIN-${i + 1}`,
  descricao: pick([
    "Fornecedor China",
    "Frete Internacional",
    "Marketing Meta",
    "Aluguel Galpão",
    "Pró-labore",
    "Energia",
    "Impostos",
    "Comissão Vendedor",
  ]),
  tipo: pick(["receita", "despesa"]) as "receita" | "despesa",
  valor: between(800, 24000),
  vencimento: `${between(1, 28)}/12/2026`,
  status: pick(["Pago", "Pendente", "Vencido"]) as "Pago" | "Pendente" | "Vencido",
}));

export const metas = [
  { nome: "Faturamento Mensal", atual: 487, meta: 600, unidade: "k" },
  { nome: "Lucro Líquido", atual: 132, meta: 180, unidade: "k" },
  { nome: "Pedidos", atual: 214, meta: 300, unidade: "" },
  { nome: "Novos Clientes", atual: 187, meta: 250, unidade: "" },
  { nome: "Conversão", atual: 3.8, meta: 5, unidade: "%" },
  { nome: "ROAS", atual: 4.6, meta: 5.5, unidade: "x" },
];

export const agenda = [
  { hora: "09:00", titulo: "Recebimento container CN-482", tipo: "Entrega" },
  { hora: "10:30", titulo: "Reunião fornecedor Guangzhou", tipo: "Reunião" },
  { hora: "14:00", titulo: "Cobrança — Pedido #8421", tipo: "Cobrança" },
  { hora: "15:30", titulo: "Reposição de estoque — Tênis Chunky", tipo: "Estoque" },
  { hora: "17:00", titulo: "Fechamento financeiro do dia", tipo: "Financeiro" },
];

export const automacoes = [
  { nome: "Carrinho abandonado (WhatsApp 1h)", ativa: true, disparos: 128 },
  { nome: "Cupom de aniversário", ativa: true, disparos: 42 },
  { nome: "Pós-venda automático (Email)", ativa: true, disparos: 214 },
  { nome: "Reativação de cliente inativo 60d", ativa: false, disparos: 0 },
  { nome: "Alerta estoque baixo", ativa: true, disparos: 8 },
  { nome: "Cobrança automática de boleto", ativa: true, disparos: 22 },
];
