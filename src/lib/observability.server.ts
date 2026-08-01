/**
 * Captura de erros no servidor.
 *
 * Envia para o Sentry quando SENTRY_DSN está configurado (Project Settings → Secrets),
 * usando a Store API via fetch (sem SDK Node, compatível com o runtime edge).
 * Sem DSN, faz fallback para log estruturado no console — nunca lança.
 */

type Extra = Record<string, unknown>;

function parseDsn(dsn: string) {
  // https://<publicKey>@<host>/<projectId>
  const m = /^https:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn.trim());
  if (!m) return null;
  return { publicKey: m[1], host: m[2], projectId: m[3] };
}

export async function captureServerError(
  error: unknown,
  context: { op: string; userId?: string | undefined; extra?: Extra } = { op: "unknown" },
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    op: context.op,
    userId: context.userId ?? null,
    message: err.message,
    stack: err.stack ?? null,
    extra: context.extra ?? {},
  };

  const dsn = process.env["SENTRY_DSN"];
  if (!dsn) {
    console.error("[server-error]", JSON.stringify(payload));
    return;
  }

  try {
    const parsed = parseDsn(dsn);
    if (!parsed) {
      console.error("[server-error] SENTRY_DSN inválido", JSON.stringify(payload));
      return;
    }
    const url = `https://${parsed.host}/api/${parsed.projectId}/store/`;
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}, sentry_client=ag-imports/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "javascript",
        level: "error",
        logger: "server-fn",
        environment: process.env["NODE_ENV"] ?? "production",
        transaction: context.op,
        user: context.userId ? { id: context.userId } : undefined,
        extra: payload.extra,
        exception: {
          values: [{ type: err.name, value: err.message, stacktrace: undefined }],
        },
        tags: { op: context.op },
      }),
    });
  } catch (reportingError) {
    console.error(
      "[server-error] falha ao reportar",
      JSON.stringify(payload),
      reportingError instanceof Error ? reportingError.message : reportingError,
    );
  }
}

/**
 * Envolve o corpo de um handler de server function com captura de erro.
 * Re-lança o erro para o cliente continuar recebendo a mensagem.
 */
export async function withCapture<T>(
  op: string,
  userId: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.name === "RateLimitError") throw error;
    await captureServerError(error, { op, userId });
    throw error;
  }
}
