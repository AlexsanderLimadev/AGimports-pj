import { z } from "zod";

/** Mensagens de validação em português, no lugar das padrão em inglês do zod. */
export const mensagensPtBr: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null") return { message: "Campo obrigatório" };
      if (issue.expected === "number") return { message: "Informe um número" };
      return { message: "Valor inválido" };
    case "too_small":
      if (issue.type === "string") {
        return { message: Number(issue.minimum) <= 1 ? "Campo obrigatório" : `Use pelo menos ${issue.minimum} caracteres` };
      }
      if (issue.type === "number") {
        return { message: Number(issue.minimum) === 0 ? "Não pode ser negativo" : `O mínimo é ${issue.minimum}` };
      }
      return { message: "Valor muito pequeno" };
    case "too_big":
      if (issue.type === "string") return { message: `Use no máximo ${issue.maximum} caracteres` };
      if (issue.type === "number") return { message: `O máximo é ${issue.maximum}` };
      return { message: "Valor muito grande" };
    case "invalid_string":
      if (issue.validation === "email") return { message: "E-mail inválido" };
      if (issue.validation === "url") return { message: "Endereço inválido (comece com https://)" };
      return { message: "Valor inválido" };
    case "invalid_union": {
      const interna = issue.unionErrors?.[0]?.issues?.[0]?.message;
      return { message: interna && interna !== ctx.defaultError ? interna : "Valor inválido" };
    }
    default:
      return { message: "Valor inválido" };
  }
};

/**
 * Valida os valores de um formulário com o mesmo schema que o servidor usa
 * e devolve uma mensagem por campo (a primeira de cada). Vazio = tudo certo.
 */
export function errosPorCampo(schema: z.ZodTypeAny, valores: unknown): Record<string, string> {
  const r = schema.safeParse(valores, { errorMap: mensagensPtBr });
  if (r.success) return {};
  const out: Record<string, string> = {};
  for (const i of r.error.issues) {
    const chave = String(i.path[0] ?? "_");
    if (!(chave in out)) out[chave] = i.message;
  }
  return out;
}
