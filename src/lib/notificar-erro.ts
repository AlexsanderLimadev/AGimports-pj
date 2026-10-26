import { toast } from "sonner";
import { interpretarErro } from "@/lib/erros-calc";

/**
 * Mostra qualquer erro como aviso em português, com código de referência quando há.
 * Sessão vencida leva ao login e, depois de entrar, de volta para a mesma tela.
 */
export function notificarErro(e: unknown): void {
  if (typeof window === "undefined") return;
  const r = interpretarErro(e);

  if (r.tipo === "sessao") {
    toast.error(r.mensagem);
    const aqui = window.location.pathname + window.location.search;
    if (!window.location.pathname.startsWith("/auth")) {
      window.setTimeout(() => {
        window.location.assign(`/auth?redirect=${encodeURIComponent(aqui)}`);
      }, 1200);
    }
    return;
  }

  if (r.codigo) console.error(`[erro ${r.codigo}]`, e);
  toast.error(r.mensagem, {
    description: r.codigo ? `Código de referência: ${r.codigo}` : undefined,
    duration: r.codigo ? 8000 : 5000,
  });
}
