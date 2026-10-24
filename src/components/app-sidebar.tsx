import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calculator,
  Package,
  Boxes,
  Users,
  ShoppingCart,
  Megaphone,
  GitBranch,
  Wallet,
  BarChart3,
  Target,
  Calendar,
  Zap,
  FileText,
  Settings,
  Truck,
  TrendingUp,
  BellRing,
  UserCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AGLogo } from "@/components/brand-fx";
import { useProximityEffect } from "@/hooks/use-proximity-effect";

const groups: { label: string; items: { title: string; url: string; icon: any }[] }[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", url: "/app", icon: LayoutDashboard },
      { title: "BI", url: "/app/bi", icon: BarChart3 },
      { title: "Metas", url: "/app/metas", icon: Target },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { title: "Produtos", url: "/app/produtos", icon: Package },
      { title: "Estoque", url: "/app/estoque", icon: Boxes },
      { title: "Fornecedores", url: "/app/fornecedores", icon: Truck },
    ],
  },
  {
    label: "Vendas",
    items: [
      { title: "Pedidos", url: "/app/pedidos", icon: ShoppingCart },
      { title: "Vendedores", url: "/app/vendedores", icon: UserCheck },
      { title: "Funis", url: "/app/funis", icon: GitBranch },
      { title: "Calculadora", url: "/app/calculadora", icon: Calculator },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Clientes", url: "/app/clientes", icon: Users },
      { title: "Agenda", url: "/app/agenda", icon: Calendar },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { title: "Marketing", url: "/app/marketing", icon: Megaphone },
      { title: "Automações", url: "/app/automacoes", icon: Zap },
      { title: "Métricas de Negócio", url: "/app/metricas", icon: TrendingUp },
      { title: "Dashboard Analítico", url: "/app/dashboard-analitico", icon: BarChart3 },
      { title: "Alertas", url: "/app/alertas", icon: BellRing },
    ],
  },
  {
    label: "Gestão",
    items: [
      { title: "Financeiro", url: "/app/financeiro", icon: Wallet },
      { title: "Relatórios", url: "/app/relatorios", icon: FileText },
      { title: "Configurações", url: "/app/configuracoes", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/app" ? path === "/app" : path.startsWith(url));
  const proximity = useProximityEffect({ radius: 90, falloff: "smooth", smoothingMs: 120 });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a] ring-1 ring-border">
            <AGLogo size={22} rounded="rounded-md" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold tracking-tight">AG Tech</div>
            <div className="truncate text-[11px] text-muted-foreground">ERP · Business Suite</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent onPointerMove={proximity.onPointerMove} onPointerLeave={proximity.onPointerLeave}>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url} ref={proximity.registerItem(item.url)} className="nav-proximity-item">
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="nav-proximity-icon h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
