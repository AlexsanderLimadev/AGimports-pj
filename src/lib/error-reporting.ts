/**
 * Captura de erro do lado do navegador (sem dependência da Lovable).
 * Complementa o observability.server.ts (que já cobre o lado do servidor
 * com Sentry). Aqui só loga no console — plugue Sentry.captureException
 * se quiser o mesmo nível de observabilidade também no cliente.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[app-error]", error, context);
}
