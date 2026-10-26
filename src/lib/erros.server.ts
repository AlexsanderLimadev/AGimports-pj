import { captureServerError } from "@/lib/observability.server";
import { classificarErroBanco, codificarErroServidor, gerarCodigoErro } from "@/lib/erros-calc";

/**
 * Usada no lugar de `throw new Error(error.message)` quando o banco devolve erro.
 * A pessoa recebe uma frase em português com um código; a mensagem técnica original
 * fica só no log do servidor, junto do mesmo código, para você achar o problema.
 */
export function falhar(error: { message: string; code?: string | null }, op: string): never {
  const { tipo, mensagem } = classificarErroBanco(error);
  const codigo = gerarCodigoErro();
  void captureServerError(new Error(error.message), { op, extra: { codigo, tipo, pgCode: error.code ?? null } });
  throw new Error(codificarErroServidor({ tipo, mensagem, codigo }));
}
