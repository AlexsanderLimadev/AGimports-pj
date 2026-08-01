import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Shield, KeyRound, Users, ScrollText, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · AG Imports" }] }),
  component: Conf,
});

const perfis = [
  { nome: "Administrador", membros: 2, cor: "text-primary" },
  { nome: "Financeiro", membros: 3, cor: "text-chart-2" },
  { nome: "Estoque", membros: 4, cor: "text-chart-3" },
  { nome: "Marketing", membros: 2, cor: "text-chart-4" },
  { nome: "Vendedor", membros: 6, cor: "text-chart-5" },
  { nome: "Atendimento", membros: 3, cor: "text-warning" },
];

function Conf() {
  return (
    <>
      <PageHeader title="Configurações" description="Segurança, equipe e conformidade" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Segurança" description="Padrão empresarial">
          <div className="space-y-3 text-sm">
            {[
              [<Shield className="h-4 w-4 text-primary" />, "MFA obrigatório", "App autenticador + email", true],
              [<KeyRound className="h-4 w-4 text-primary" />, "Rotação de senhas", "A cada 90 dias", true],
              [<Lock className="h-4 w-4 text-primary" />, "Criptografia AES-256", "Dados sensíveis em repouso", true],
              [<ScrollText className="h-4 w-4 text-primary" />, "Logs de auditoria", "Todas as ações registradas", true],
            ].map(([icon, title, desc, on], i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  {icon as any}
                  <div>
                    <div className="font-medium">{title as string}</div>
                    <div className="text-xs text-muted-foreground">{desc as string}</div>
                  </div>
                </div>
                <Switch defaultChecked={on as boolean} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Perfis de acesso" description="Controle granular por função">
          <div className="grid grid-cols-2 gap-2">
            {perfis.map((p) => (
              <div key={p.nome} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <Users className={`h-4 w-4 ${p.cor}`} />
                  <div className="text-sm font-medium">{p.nome}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{p.membros} membros</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Conformidade" description="LGPD e boas práticas" className="mt-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          {["LGPD ✓", "TLS 1.3 ✓", "Backup diário ✓", "Alta disponibilidade ✓"].map((t) => (
            <div key={t} className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-primary">{t}</div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
