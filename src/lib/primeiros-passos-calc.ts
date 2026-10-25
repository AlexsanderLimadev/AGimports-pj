/** Passos para deixar a conta pronta, calculados só com o que já existe no banco. */

export type ContagemConta = {
  produtos: number;
  produtosComCusto: number;
  clientes: number;
  vendedores: number;
  pedidos: number;
};

export type Passo = {
  id: "produto" | "custo" | "cliente" | "vendedor" | "pedido";
  titulo: string;
  descricao: string;
  to: "/app/produtos" | "/app/clientes" | "/app/vendedores" | "/app/pedidos";
  feito: boolean;
  /** passos opcionais não impedem a lista de ser considerada concluída */
  opcional: boolean;
};

export type PrimeirosPassos = {
  passos: Passo[];
  feitos: number;
  total: number;
  concluido: boolean;
  /** primeiro passo ainda não feito, para destacar */
  proximo: Passo | null;
};

export function calcularPassos(c: ContagemConta): PrimeirosPassos {
  const passos: Passo[] = [
    {
      id: "produto",
      titulo: "Cadastre seu primeiro produto",
      descricao: "Nome, SKU, preço de venda e estoque inicial.",
      to: "/app/produtos",
      feito: c.produtos > 0,
      opcional: false,
    },
    {
      id: "custo",
      titulo: "Informe o custo dos produtos",
      descricao: "Sem o custo, o sistema não calcula margem, ROI nem os alertas de margem baixa.",
      to: "/app/produtos",
      feito: c.produtosComCusto > 0,
      opcional: false,
    },
    {
      id: "cliente",
      titulo: "Cadastre um cliente",
      descricao: "Para ligar os pedidos a quem comprou.",
      to: "/app/clientes",
      feito: c.clientes > 0,
      opcional: false,
    },
    {
      id: "vendedor",
      titulo: "Cadastre quem vende",
      descricao: "Aparece no pedido e alimenta o ranking do Dashboard Analítico.",
      to: "/app/vendedores",
      feito: c.vendedores > 0,
      opcional: true,
    },
    {
      id: "pedido",
      titulo: "Registre o primeiro pedido",
      descricao: "A partir daqui os números do Dashboard Analítico passam a existir.",
      to: "/app/pedidos",
      feito: c.pedidos > 0,
      opcional: false,
    },
  ];
  const feitos = passos.filter((p) => p.feito).length;
  const obrigatoriosFaltando = passos.filter((p) => !p.opcional && !p.feito).length;
  return {
    passos,
    feitos,
    total: passos.length,
    concluido: obrigatoriosFaltando === 0,
    proximo: passos.find((p) => !p.feito) ?? null,
  };
}
