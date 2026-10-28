import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  codigoValido,
  fatoresTotpPendentes,
  fatoresTotpVerificados,
  limparCodigo,
  traduzirErroMfa,
} from "@/lib/mfa-calc";

type Inscricao = { id: string; qr: string; segredo: string };

/** Ativar, usar e desativar a verificação em duas etapas (aplicativo autenticador). */
export function MfaConfig() {
  const [carregando, setCarregando] = useState(true);
  const [fatorAtivo, setFatorAtivo] = useState<string | null>(null);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [desativando, setDesativando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      setErro(traduzirErroMfa(error.message));
    } else {
      setFatorAtivo(fatoresTotpVerificados(data?.all)[0]?.id ?? null);
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  function voltar() {
    setInscricao(null);
    setDesativando(false);
    setCodigo("");
    setErro(null);
  }

  async function iniciar() {
    setOcupado(true);
    setErro(null);
    try {
      // Limpa tentativas antigas que ficaram pela metade, senão o Supabase recusa um novo cadastro.
      const { data: lista } = await supabase.auth.mfa.listFactors();
      for (const f of fatoresTotpPendentes(lista?.all)) await supabase.auth.mfa.unenroll({ factorId: f.id });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `AG Tech ${new Date().toISOString().slice(0, 19)}`,
      });
      if (error) throw error;
      setInscricao({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
      setCodigo("");
    } catch (e) {
      setErro(traduzirErroMfa(e instanceof Error ? e.message : ""));
    } finally {
      setOcupado(false);
    }
  }

  async function cancelarInscricao() {
    if (inscricao) await supabase.auth.mfa.unenroll({ factorId: inscricao.id }).catch(() => {});
    voltar();
  }

  async function confirmarAtivacao() {
    if (!inscricao || !codigoValido(codigo)) return;
    setOcupado(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: inscricao.id, code: codigo });
      if (error) throw error;
      toast.success("Verificação em duas etapas ativada");
      voltar();
      await recarregar();
    } catch (e) {
      setErro(traduzirErroMfa(e instanceof Error ? e.message : ""));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarDesativacao() {
    if (!fatorAtivo || !codigoValido(codigo)) return;
    setOcupado(true);
    setErro(null);
    try {
      // Desativar exige ter confirmado o código nesta sessão.
      const v = await supabase.auth.mfa.challengeAndVerify({ factorId: fatorAtivo, code: codigo });
      if (v.error) throw v.error;
      const { error } = await supabase.auth.mfa.unenroll({ factorId: fatorAtivo });
      if (error) throw error;
      toast.success("Verificação em duas etapas desativada");
      voltar();
      await recarregar();
    } catch (e) {
      setErro(traduzirErroMfa(e instanceof Error ? e.message : ""));
    } finally {
      setOcupado(false);
    }
  }

  const campoCodigo = (aoEnter: () => void) => (
    <div className="grid gap-1.5">
      <Label htmlFor="mfa-codigo">Código de 6 dígitos do aplicativo</Label>
      <Input
        id="mfa-codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={7}
        value={codigo}
        onChange={(e) => setCodigo(limparCodigo(e.target.value))}
        onKeyDown={(e) => e.key === "Enter" && aoEnter()}
        className="max-w-[10rem] tabular tracking-widest"
      />
    </div>
  );

  return (
    <SectionCard
      title="Verificação em duas etapas"
      description="Além da senha, pede um código do aplicativo autenticador do seu celular"
      className="mt-4"
    >
      <div className="space-y-3 p-4 text-sm">
        {carregando ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : inscricao ? (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
              <li>Abra um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator, Authy, 1Password).</li>
              <li>Escaneie o código abaixo, ou digite o código manual.</li>
              <li>Digite aqui o número de 6 dígitos que o aplicativo mostrar.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={inscricao.qr}
                alt="Código QR para o aplicativo autenticador"
                className="h-40 w-40 rounded-md border border-border bg-white p-2"
              />
              <div className="min-w-0 text-xs">
                <div className="text-muted-foreground">Código manual (guarde em um gerenciador de senhas)</div>
                <code className="mt-1 block break-all rounded bg-muted px-2 py-1 font-mono">{inscricao.segredo}</code>
              </div>
            </div>
            {campoCodigo(confirmarAtivacao)}
            {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmarAtivacao} disabled={ocupado || !codigoValido(codigo)}>
                {ocupado && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Confirmar e ativar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelarInscricao} disabled={ocupado}>
                Cancelar
              </Button>
            </div>
          </>
        ) : fatorAtivo ? (
          <>
            <p className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Ativa. O login pede o código do aplicativo.
            </p>
            {desativando ? (
              <>
                <p className="text-xs text-muted-foreground">Para desativar, confirme com o código atual do aplicativo.</p>
                {campoCodigo(confirmarDesativacao)}
                {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={confirmarDesativacao} disabled={ocupado || !codigoValido(codigo)}>
                    {ocupado && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Desativar
                  </Button>
                  <Button size="sm" variant="outline" onClick={voltar} disabled={ocupado}>
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setDesativando(true)}>
                Desativar
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Hoje só a senha protege a sua conta. Com a verificação em duas etapas, quem descobrir a senha ainda precisaria do seu celular.
            </p>
            <p className="text-xs text-muted-foreground">
              Atenção: se você perder o celular e não tiver guardado o código manual, só dá para recuperar a conta pelo painel do Supabase.
            </p>
            {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
            <Button size="sm" onClick={iniciar} disabled={ocupado}>
              {ocupado && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Ativar verificação em duas etapas
            </Button>
          </>
        )}
      </div>
    </SectionCard>
  );
}
