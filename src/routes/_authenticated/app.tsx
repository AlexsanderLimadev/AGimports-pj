import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, LogOut, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { resolveSearch } from "@/lib/search-routes";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

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
              <button className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card hover:bg-accent">
                <Bell className="h-4 w-4" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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
            <div key={pathname} className="fade-in-up">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
