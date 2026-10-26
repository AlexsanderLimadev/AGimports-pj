import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { Shimmer } from "@/components/ui-bits";
import { TELAS_DERIVADAS } from "@/lib/telas-derivadas";
import { notificarErro } from "@/lib/notificar-erro";

/** Aparece quase na hora ao clicar, enquanto a página nova carrega. */
function PaginaCarregando() {
  return (
    <div className="p-6" aria-busy="true" aria-label="Carregando">
      <Shimmer className="h-7 w-48" />
      <Shimmer className="mt-2 h-4 w-72" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
        <Shimmer className="h-24" />
      </div>
      <Shimmer className="mt-4 h-64 w-full" />
    </div>
  );
}


export const getRouter = () => {
  const queryClient: QueryClient = new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: () => {
        for (const chave of TELAS_DERIVADAS) queryClient.invalidateQueries({ queryKey: [chave] });
      },
      // Todo erro de gravação vira aviso em português com código de referência.
      onError: (error) => notificarErro(error),
    }),
    defaultOptions: {
      queries: {
        // Dados vistos há menos de 30s abrem na hora, sem nova consulta.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Começa a carregar a página quando o mouse passa por cima do link
    // (ou o dedo encosta), então o clique já encontra tudo pronto.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // O cache de dados é do TanStack Query, não do router.
    defaultPreloadStaleTime: 0,
    // Feedback visual rápido, sem piscar quando a página já é veloz.
    defaultPendingMs: 120,
    defaultPendingMinMs: 250,
    defaultPendingComponent: PaginaCarregando,
  });

  return router;
};
