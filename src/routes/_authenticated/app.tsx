import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search, PackageX, Wallet, PartyPopper, TrendingDown, Hourglass } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { resolveSearch, APP_SEARCH_ROUTES } from "@/lib/search-routes";
import { dashboardStats } from "@/lib/products.functions";
import { listLancamentos } from "@/lib/financeiro.functions";
import { logAccess } from "@/lib/access-log.functions";
import { getAlertasNegocio } from "@/lib/alertas.functions";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string>("");
  const [appSearch, setAppSearch] = useState("");
  const statsFn = useServerFn(dashboardStats);
  const lancamentosFn = useServerFn(listLancamentos);
  const logAccessFn = useServerFn(logAccess);
  const [alerts, setAlerts] = useState<{ lowStock: number; vencidos: number }>({ lowStock: 0, vencidos: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? ""));
  }, []);

  // Central de alertas: dado real, nada de notificação externa (WhatsApp
  // etc.) — tudo dentro do próprio site, como pedido.
  useEffect(() => {
    async function loadAlerts() {
      try {
        const [stats, lancamentos] = await Promise.all([statsFn(), lancamentosFn({ data: {} })]);
        const hoje = new Date().toISOString().slice(0, 10);
        const vencidos = lancamentos.filter(
          (l) => l.status !== "pago" && l.status !== "cancelado" && l.data <= hoje,
        ).length;
        setAlerts({ lowStock: stats.lowStock, vencidos });
      } catch {
        // Central de alertas é conveniência, não coisa crítica — se falhar,
        // só não mostra nada, não interrompe o resto do app.
      }
    }
    loadAlerts();
  }, [statsFn, lancamentosFn]);

  // Alertas de negócio (margem baixa e estoque parado). Se falhar, o sino segue com os outros.
  const { data: negocio } = useQuery({
    queryKey: ["alertas-negocio"],
    queryFn: () => getAlertasNegocio(),
    staleTime: 60_000,
    retry: false,
  });
  const margemBaixa = negocio?.margemBaixa.length ?? 0;
  const estoqueParado = negocio?.estoqueParado.length ?? 0;

  const totalAlerts = alerts.lowStock + alerts.vencidos + margemBaixa + estoqueParado;

  const initials = (email.split("@")[0] || "AG").slice(0, 2).toUpperCase();

  function handleAppSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = appSearch.trim();
    if (!q) return;
    const match = resolveSearch(q);
    if (!match) {
      toast.error(`Não encontrei nada pra "${q}". Tenta produtos, pedidos, clientes, estoque...`);
      return;
    }
    setAppSearch("");
    navigate({ to: match.path });
  }

  async function signOut() {
    await logAccessFn({ data: { event: "sign_out", userAgent: navigator.userAgent } }).catch(() => {});
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <form onSubmit={handleAppSearch} className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Buscar produtos, pedidos, clientes..."
                className="h-9 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
              />
            </form>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Notificações" className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-card hover:bg-accent">
                    <Bell className="h-4 w-4" />
                    {totalAlerts > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                        {totalAlerts}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Central de alertas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {totalAlerts === 0 ? (
                    <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                      <PartyPopper className="h-4 w-4" /> Tudo em dia por aqui.
                    </div>
                  ) : (
                    <>
                      {alerts.vencidos > 0 && (
                        <DropdownMenuItem onClick={() => navigate({ to: "/app/financeiro" })} className="cursor-pointer gap-2">
                          <Wallet className="h-4 w-4 text-destructive" />
                          <span>{alerts.vencidos} lançamento{alerts.vencidos > 1 ? "s" : ""} vencido{alerts.vencidos > 1 ? "s" : ""} ou vencendo hoje</span>
                        </DropdownMenuItem>
                      )}
                      {alerts.lowStock > 0 && (
                        <DropdownMenuItem onClick={() => navigate({ to: "/app/estoque" })} className="cursor-pointer gap-2">
                          <PackageX className="h-4 w-4 text-warning" />
                          <span>{alerts.lowStock} produto{alerts.lowStock > 1 ? "s" : ""} com estoque baixo</span>
                        </DropdownMenuItem>
                      )}
                      {margemBaixa > 0 && (
                        <DropdownMenuItem onClick={() => navigate({ to: "/app/alertas" })} className="cursor-pointer gap-2">
                          <TrendingDown className="h-4 w-4 text-warning" />
                          <span>{margemBaixa} produto{margemBaixa > 1 ? "s" : ""} com margem baixa</span>
                        </DropdownMenuItem>
                      )}
                      {estoqueParado > 0 && (
                        <DropdownMenuItem onClick={() => navigate({ to: "/app/alertas" })} className="cursor-pointer gap-2">
                          <Hourglass className="h-4 w-4 text-warning" />
                          <span>{estoqueParado} produto{estoqueParado > 1 ? "s" : ""} com estoque parado</span>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Menu da conta" className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate text-xs">{email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Breadcrumb pathname={pathname} />
            <div key={pathname} className="fade-in-up">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const isRoot = pathname === "/app";
  const current = APP_SEARCH_ROUTES.find((r) => r.path === pathname);
  return (
    <nav aria-label="Trilha de navegação" className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/app" className="hover:text-foreground">Dashboard</Link>
      {!isRoot && (
        <>
          <span>/</span>
          <span className="text-foreground">{current?.label ?? "Página"}</span>
        </>
      )}
    </nav>
  );
}
