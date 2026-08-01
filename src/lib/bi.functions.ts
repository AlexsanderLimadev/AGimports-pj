import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getBiOverviewCached } from "@/lib/bi.server";
import { withCapture } from "@/lib/observability.server";

export const biOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ refresh: z.boolean().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) =>
    withCapture("biOverview", context.userId, () =>
      getBiOverviewCached(context.supabase, context.userId, { refresh: data.refresh ?? false }),
    ),
  );
