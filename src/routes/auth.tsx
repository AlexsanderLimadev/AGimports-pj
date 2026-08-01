import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import logo from "@/assets/ag-imports-logo.png";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · AG Imports" }] }),
  validateSearch: searchSchema,
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const { redirect: redirectTo } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo ?? "/app", replace: true });
    });
  }, [navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: redirectTo ?? "/app", replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
        navigate({ to: redirectTo ?? "/app", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("E-mail de recuperação enviado.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  // OAuth nativo do Supabase — sem proxy da Lovable. Exige o provedor
  // "Google" configurado em Supabase Dashboard > Authentication >
  // Providers > Google (Client ID/Secret do Google Cloud Console).
  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectTo ?? "/app"}` },
    });
    if (error) {
      toast.error(error.message ?? "Falha ao entrar com Google");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={logo} alt="AG Imports" className="h-14 w-14 rounded-xl bg-white p-2 shadow-sm" />
          <div className="text-center">
            <div className="text-lg font-semibold tracking-tight">AG Imports</div>
            <div className="text-xs text-muted-foreground">ERP · Business Suite</div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          <h1 className="text-lg font-semibold tracking-tight">
            {mode === "signin" && "Entrar na sua conta"}
            {mode === "signup" && "Criar sua conta"}
            {mode === "forgot" && "Recuperar senha"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "signin" && "Acesse o painel de gestão AG Imports."}
            {mode === "signup" && "Comece a gerenciar seu negócio em minutos."}
            {mode === "forgot" && "Enviaremos um link para redefinir sua senha."}
          </p>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium transition hover:border-primary/40 disabled:opacity-60"
              >
                <GoogleIcon /> Continuar com Google
              </button>
              <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field
                label="Nome completo"
                value={fullName}
                onChange={setFullName}
                type="text"
                required
                autoComplete="name"
              />
            )}
            <Field
              label="E-mail"
              value={email}
              onChange={setEmail}
              type="email"
              required
              autoComplete="email"
            />
            {mode !== "forgot" && (
              <Field
                label="Senha"
                value={password}
                onChange={setPassword}
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" && "Entrar"}
              {mode === "signup" && "Criar conta"}
              {mode === "forgot" && "Enviar link"}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-1.5 text-center text-xs text-muted-foreground">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("forgot")} className="hover:text-foreground">
                  Esqueceu a senha?
                </button>
                <div>
                  Novo por aqui?{" "}
                  <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                    Criar conta
                  </button>
                </div>
              </>
            )}
            {mode === "signup" && (
              <div>
                Já tem conta?{" "}
                <button onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                  Entrar
                </button>
              </div>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("signin")} className="hover:text-foreground">
                Voltar ao login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const { value, onChange, ...input } = rest;
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.98 6.98 0 0 1 5.47 12c0-.73.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
