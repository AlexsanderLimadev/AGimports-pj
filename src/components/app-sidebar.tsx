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
import logo from "@/assets/ag-imports-logo.png";

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
    ],
  },
  {
    label: "Vendas",
    items: [
      { title: "Pedidos", url: "/app/pedidos", icon: ShoppingCart },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <img
            src={logo}
            alt="AG Imports"
            className="h-9 w-9 shrink-0 rounded-full bg-white p-1 ring-1 ring-border object-cover"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold tracking-tight">AG Imports</div>
            <div className="truncate text-[11px] text-muted-foreground">ERP · Business Suite</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
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
