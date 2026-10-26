/**
 * Tradução de erros técnicos para frases que a pessoa entende.
 * Função pura (sem rede, sem tela): o servidor usa para traduzir erros do banco
 * e o navegador usa para mostrar o aviso.
 */

export type TipoErro = "sessao" | "duplicado" | "vinculo" | "permissao" | "campos" | "rede" | "limite" | "banco" | "generico";

export type ErroInterpretado = {
  tipo: TipoErro;
  mensagem: string;
  /** Código curto para o suporte achar o erro no log. Nulo quando a mensagem foi escrita de propósito para a pessoa. */
  codigo: string | null;
};

type ErroBruto = { message?: string | null; code?: string | null };

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O e 1/I, para não confundir ao ditar

export function gerarCodigoErro(rng: () => number = Math.random, tamanho = 4): string {
  let s = "";
  for (let i = 0; i < tamanho; i++) s += ALFABETO[Math.floor(rng() * ALFABETO.length) % ALFABETO.length];
  return s;
}

const FRASE_GENERICA =
  "Não foi possível concluir. Tente de novo; se continuar, avise o suporte informando o código abaixo.";

const MENSAGENS: Record<TipoErro, string> = {
  sessao: "Sua sessão acabou. Entre de novo para continuar.",
  duplicado: "Já existe um registro com esses dados. Mude o nome ou o código e tente de novo.",
  vinculo: "Este registro está ligado a outros dados (por exemplo, pedidos). Remova ou troque a ligação antes.",
  permissao: "Você não tem permissão para fazer isso.",
  campos: "Confira os campos preenchidos: algum valor está faltando ou fora do permitido.",
  rede: "Sem conexão com o servidor. Confira a internet e tente de novo.",
  limite: "Muitas ações seguidas. Aguarde um minuto e tente de novo.",
  banco: "O banco de dados ainda não está atualizado para essa função. Avise quem administra o sistema.",
  generico: FRASE_GENERICA,
};

/** Classifica um erro do Postgres/PostgREST (tem `code`) ou um erro de texto solto. */
export function classificarErroBanco(e: ErroBruto): { tipo: TipoErro; mensagem: string } {
  const code = (e.code ?? "").toString();
  const msg = (e.message ?? "").toLowerCase();

  const de = (tipo: TipoErro, mensagem = MENSAGENS[tipo]) => ({ tipo, mensagem });

  if (code === "23505") return de("duplicado");
  if (code === "23503") return de("vinculo");
  if (code === "23502" || code === "23514" || code === "22P02" || code === "22003" || code === "22001" || code === "22007") return de("campos");
  if (code === "42501") return de("permissao");
  if (code === "PGRST301" || /jwt|unauthorized|not authenticated|invalid token|refresh token/.test(msg)) return de("sessao");
  if (code === "PGRST116") return de("generico", "Registro não encontrado. Atualize a página e tente de novo.");
  if (code === "42P01" || code === "42703" || code === "PGRST204" || code === "PGRST205" || /schema cache|does not exist|could not find the/.test(msg)) return de("banco");
  if (code === "57014") return de("generico", "A operação demorou demais. Tente de novo.");
  if (/rate limit|too many requests|muitas requisi|muitas a[cç][oõ]es/.test(msg)) return de("limite");
  if (/failed to fetch|fetch failed|networkerror|network request|econn|etimedout|load failed|enotfound/.test(msg)) return de("rede");
  return de("generico");
}

const MARCA = /\s*\[ref:([A-Z0-9]{3,8}):([a-z]+)\]\s*$/;
const TIPOS: TipoErro[] = ["sessao", "duplicado", "vinculo", "permissao", "campos", "rede", "limite", "banco", "generico"];

/** Texto que o servidor joga como erro: frase + marca com código e tipo no fim. */
export function codificarErroServidor(i: ErroInterpretado): string {
  return `${i.mensagem} [ref:${i.codigo ?? "XXXX"}:${i.tipo}]`;
}

// Textos que só fazem sentido para quem programa. Se a mensagem tem isso, não vai para a tela.
const PARECE_TECNICO =
  /violates|constraint|relation "|column "|schema|pgrst|postgres|supabase|syntax|\bjwt\b|undefined|\bnull\b|failed to|fetch|typeerror|referenceerror|econn|\bsql\b|\buuid\b|\bat \w+\.|unauthorized|rate limit|too many/i;

/**
 * Transforma qualquer coisa que foi capturada num erro (Error, texto, objeto) em algo mostrável.
 * Mensagens escritas de propósito em português passam direto; o resto é traduzido.
 */
export function interpretarErro(e: unknown, rng: () => number = Math.random): ErroInterpretado {
  const bruto =
    e instanceof Error ? e.message : typeof e === "string" ? e : e && typeof e === "object" && "message" in e ? String((e as ErroBruto).message ?? "") : "";
  const code = e && typeof e === "object" && "code" in e ? String((e as ErroBruto).code ?? "") : "";

  const m = MARCA.exec(bruto);
  if (m && (TIPOS as string[]).includes(m[2])) {
    return { tipo: m[2] as TipoErro, mensagem: bruto.replace(MARCA, "").trim(), codigo: m[1] };
  }

  // Erro de validação (zod) que veio do servidor: a mensagem é um JSON com a lista de problemas.
  if (bruto.trim().startsWith("[") && /"(code|path)"\s*:/.test(bruto)) {
    return { tipo: "campos", mensagem: MENSAGENS.campos, codigo: null };
  }

  const classificado = classificarErroBanco({ message: bruto, code });
  const textoLivre = bruto.trim().length > 0 && !PARECE_TECNICO.test(bruto) && classificado.tipo === "generico";
  if (textoLivre) return { tipo: "generico", mensagem: bruto.trim(), codigo: null };

  const semCodigo = classificado.tipo === "sessao" || classificado.tipo === "limite" || classificado.tipo === "permissao";
  return { ...classificado, codigo: semCodigo ? null : gerarCodigoErro(rng) };
}
