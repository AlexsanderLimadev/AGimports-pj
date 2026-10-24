import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rate-limit.server";
import { normalizarConfig, type ConfigAlertas } from "@/lib/alertas-calc";

export const getConfigNegocio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConfigAlertas> => {
    const { data, error } = await context.supabase
      .from("config_negocio")
      .select("margem_minima_pct, dias_estoque_parado")
      .eq("user_id", context.userId)
      .maybeSingle();
    // Sem registro (ou tabela ainda não criada) = usa os padrões.
    if (error || !data) return normalizarConfig(null);
    return normalizarConfig({
      margemMinimaPct: data.margem_minima_pct,
      diasEstoqueParado: data.dias_estoque_parado,
    });
  });

export const saveConfigNegocio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        margemMinimaPct: z.number().min(0).max(100),
        diasEstoqueParado: z.number().int().min(1).max(3650),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<ConfigAlertas> => {
    await enforceRateLimit(context.supabase, context.userId, "saveConfigNegocio", 30);
    const { error } = await context.supabase.from("config_negocio").upsert(
      {
        user_id: context.userId,
        margem_minima_pct: data.margemMinimaPct,
        dias_estoque_parado: data.diasEstoqueParado,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      if (error.message.includes("config_negocio")) {
        throw new Error("A tabela de configuração ainda não existe no banco. Rode o SQL 20261023_config_negocio.sql no Supabase.");
      }
      throw new Error(error.message);
    }
    return normalizarConfig(data);
  });
