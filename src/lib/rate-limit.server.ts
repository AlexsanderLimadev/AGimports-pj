import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rate limiting básico por usuário/janela de 1 minuto.
 *
 * Política: FAIL-OPEN. Se a checagem falhar (rede, permissão, tabela indisponível),
 * a requisição é liberada e apenas registramos o problema no log. O objetivo é
 * conter abuso/automação, nunca derrubar o uso legítimo do sistema.
 */
export type RateLimitResult = { allowed: boolean; remaining: number; degraded: boolean };

export async function checkRateLimit(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  bucket: string,
  max: number,
): Promise<RateLimitResult> {
  try {
    const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();

    const { data: existing, error: selErr } = await supabase
      .from("rate_limit_hits")
      .select("id, count")
      .eq("user_id", userId)
      .eq("bucket", bucket)
      .eq("window_start", windowStart)
      .maybeSingle();
    if (selErr) throw new Error(selErr.message);

    if (!existing) {
      const { error: insErr } = await supabase
        .from("rate_limit_hits")
        .insert({ user_id: userId, bucket, window_start: windowStart, count: 1 });
      if (insErr) throw new Error(insErr.message);
      return { allowed: true, remaining: Math.max(0, max - 1), degraded: false };
    }

    if (existing.count >= max) {
      return { allowed: false, remaining: 0, degraded: false };
    }

    const { error: updErr } = await supabase
      .from("rate_limit_hits")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
    if (updErr) throw new Error(updErr.message);

    return { allowed: true, remaining: Math.max(0, max - existing.count - 1), degraded: false };
  } catch (error) {
    console.warn(
      `[rate-limit] checagem degradada (fail-open) bucket=${bucket} user=${userId}:`,
      error instanceof Error ? error.message : error,
    );
    return { allowed: true, remaining: max, degraded: true };
  }
}

export class RateLimitError extends Error {
  constructor(message = "Muitas requisições. Aguarde um instante e tente novamente.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Aplica o limite e lança RateLimitError quando excedido. */
export async function enforceRateLimit(
  supabase: SupabaseClient<any, any, any>,
  userId: string,
  bucket: string,
  max: number,
): Promise<void> {
  const result = await checkRateLimit(supabase, userId, bucket, max);
  if (!result.allowed) throw new RateLimitError();
}
