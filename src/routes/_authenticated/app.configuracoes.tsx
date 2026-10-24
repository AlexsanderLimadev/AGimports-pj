import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clock, Loader2, LogOut, Mail } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertasConfig } from "@/components/alertas-config";
import { supabase } from "@/integrations/supabase/client";
import { listAccessLogs } from "@/lib/access-log.functions";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · AG Tech" }] }),
  component: Conf,
});

const EVENT_LABEL: Record<string, string> = {
  sign_in: "Login",
  sign_out: "Logout",
  sign_up: "Conta criada",
  password_reset: "Recuperação de senha",
};

/** O que o sistema faz de verdade hoje, e o que ainda não existe. */
const SEGURANCA: { titulo: string; detalhe: string; ativo: boolean }[] = [
  { titulo: "Dados isolados por conta", detalhe: "O banco só entrega os registros do dono da conta (RLS).", ativo: true },
  { titulo: "Limite de tentativas", detalhe: "Cadastros têm limite de requisições por minuto, contra abuso.", ativo: true },
  { titulo: "Registro de acessos", detalhe: "Login e logout ficam guardados e aparecem abaixo.", ativo: true },
  { titulo: "Verificação em duas etapas", detalhe: "Ainda não disponível.", ativo: false },
  { titulo: "Equipe e perfis de acesso", detalhe: "Hoje cada conta é de uma pessoa. Ainda não disponível.", ativo: false },
];

function Conf() {
  const navigate = useNavigate();
  const listLogsFn = useServerFn(listAccessLogs);
  const [logs, setLogs] = useState<{ id: number; event: string; user_agent: string | null; created_at: string }[]>([]);
  const [email, setEmail] = useState("");
  const [criadaEm, setCriadaEm] = useState<string | null>(null);
  const [enviandoSenha, setEnviandoSenha] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    listLogsFn().then(setLogs).catch(() => {});
  }, [listLogsFn]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? "");
      setCriadaEm(data.session?.user.created_at ?? null);
    });
  }, []);

  async function trocarSenha() {
    if (!email) return;
    setEnviandoSenha(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Enviamos um link para o seu e-mail. Verifique também o spam.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar o link.");
    } finally {
      setEnviandoSenha(false);
    }
  }

  async function sairDeTodos() {
    setSaindo(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      navigate({ to: "/auth", replace: true });
    } catch (e) {
      setSaindo(false);
      toast.error(e instanceof Error ? e.message : "Não foi possível sair de todos os dispositivos.");
    }
  }

  return (
    <>
      <PageHeader title="Configurações" description="Sua conta, alertas, segurança e privacidade" />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Sua conta" description="Dados de acesso">
          <div className="grid gap-4 p-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">E-mail de login</div>
              <div className="mt-0.5 font-medium">{email || "Carregando..."}</div>
            </div>
            {criadaEm && (
              <div>
                <div className="text-xs text-muted-foreground">Conta criada em</div>
                <div className="mt-0.5 font-medium">{new Date(criadaEm).toLocaleDateString("pt-BR")}</div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={trocarSenha} disabled={!email || enviandoSenha}>
                {enviandoSenha ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
                Trocar senha por e-mail
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={saindo}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Sair de todos os dispositivos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sair de todos os dispositivos?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Você será desconectado aqui e em qualquer outro computador ou celular onde esteja logado.
                      Para entrar de novo, use seu e-mail e senha.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={sairDeTodos}>Sair de todos</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SectionCard>

        <AlertasConfig />
      </div>

      <SectionCard title="Segurança" description="O que está ativo hoje e o que ainda não existe">
        <ul className="divide-y divide-border">
          {SEGURANCA.map((s) => (
            <li key={s.titulo} className="flex items-start gap-3 px-4 py-3 text-sm">
              {s.ativo ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Ativo" />
              ) : (
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Em breve" />
              )}
              <span className="min-w-0">
                <span className="block font-medium">{s.titulo}</span>
                <span className="text-xs text-muted-foreground">{s.detalhe}</span>
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Log de acesso" description="Seus últimos acessos à plataforma" className="mt-4">
        {logs.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">Nenhum acesso registrado ainda.</p>
        ) : (
          <div className="space-y-1.5 p-4">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2 text-xs">
                <span className="font-medium">{EVENT_LABEL[l.event] ?? l.event}</span>
                <span className="text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Privacidade e dados" description="O que você pode fazer com os dados" className="mt-4">
        <ul className="divide-y divide-border text-sm">
          <li className="px-4 py-3">
            <span className="font-medium">Dados de clientes (LGPD).</span>{" "}
            <span className="text-muted-foreground">
              Em <Link to="/app/clientes" className="underline underline-offset-2">Clientes</Link> você exporta ou anonimiza os dados de uma pessoa.
            </span>
          </li>
          <li className="px-4 py-3">
            <span className="font-medium">Backup.</span>{" "}
            <span className="text-muted-foreground">
              O backup não é automático. Rode <code className="rounded bg-muted px-1">npm run backup</code> toda semana e guarde a pasta fora do computador.
            </span>
          </li>
          <li className="px-4 py-3">
            <span className="font-medium">Documentos.</span>{" "}
            <Link to="/termos" className="underline underline-offset-2">Termos de Uso</Link>
            <span className="text-muted-foreground"> e </span>
            <Link to="/privacidade" className="underline underline-offset-2">Política de Privacidade</Link>.
          </li>
        </ul>
      </SectionCard>
    </>
  );
}
