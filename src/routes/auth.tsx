import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { AGLogoFull, Grain, Grid, useMouseRel } from "@/components/brand-fx";
import { logAccess } from "@/lib/access-log.functions";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · AG Tech" }] }),
  validateSearch: searchSchema,
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

// Mesma foto de fundo do design do Figma Make (arte de composição, sem
// pessoa/identidade real — segue as regras de direitos autorais).
const BG_URL =
  "https://images.unsplash.com/photo-1671159593357-ee577a598f71?w=1920&h=1080&fit=crop&auto=format&q=80";

function AuthPage() {
  const { redirect: redirectTo, mode: modeParam } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const logAccessFn = useServerFn(logAccess);
  const [mode, setMode] = useState<Mode>(modeParam ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePos = useMouseRel(pageRef);
  const cardMouse = useMouseRel(cardRef);
  const [cardHov, setCardHov] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const [mag, setMag] = useState({ x: 0, y: 0 });
  const [magOn, setMagOn] = useState(false);
  const magRafRef = useRef<number | null>(null);
  const onMag = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const next = { x: (e.clientX - (r.left + r.width / 2)) * 0.22, y: (e.clientY - (r.top + r.height / 2)) * 0.22 };
    if (magRafRef.current == null) {
      magRafRef.current = requestAnimationFrame(() => {
        setMag(next);
        magRafRef.current = null;
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirectTo ?? "/app", replace: true });
    });
  }, [navigate, redirectTo]);

  // Traduz as mensagens mais comuns que o Supabase Auth devolve (em inglês,
  // técnicas) pra algo que a pessoa realmente entende. Se a mensagem não
  // for uma dessas conhecidas, mostra a original em vez de esconder o erro.
  function friendlyAuthError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e o spam.";
    if (m.includes("user already registered") || m.includes("already registered")) return "Este e-mail já tem conta. Tente entrar em vez de criar uma nova.";
    if (m.includes("password should be at least")) return "A senha precisa ter pelo menos 8 caracteres.";
    if (m.includes("rate limit") || m.includes("too many requests")) return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
    if (m.includes("network") || m.includes("fetch")) return "Não foi possível falar com o servidor. Confira sua internet; se o problema continuar, o banco de dados pode estar indisponível.";
    return message;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        logAccessFn({ data: { event: "sign_in", userAgent: navigator.userAgent } }).catch(() => {});
        navigate({ to: redirectTo ?? "/app", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;

        // Se o Supabase exige confirmação de e-mail, signUp() cria a conta
        // mas NÃO devolve uma sessão ativa — navegar pro /app nesse caso só
        // faria a pessoa ser jogada de volta pro login, parecendo que "não
        // funcionou". Em vez disso, avisa claramente o que fazer.
        if (!data.session) {
          toast.success("Conta criada! Verifique seu e-mail para confirmar o acesso.", { duration: 8000 });
          setMode("signin");
          return;
        }

        toast.success("Conta criada com sucesso!");
        logAccessFn({ data: { event: "sign_up", userAgent: navigator.userAgent } }).catch(() => {});
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
      const raw = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(friendlyAuthError(raw));
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
      const m = error.message.toLowerCase();
      const friendly = m.includes("provider is not enabled") || m.includes("unsupported provider")
        ? "Login com Google ainda não foi configurado neste sistema. Use e-mail e senha por enquanto."
        : friendlyAuthError(error.message);
      toast.error(friendly);
      setLoading(false);
    }
  }

  return (
    <div
      ref={pageRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#0a0a0a",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,255,255,0.04) 0%, transparent 55%)`,
        }}
      />
      <Grid />
      <Grain />

      <div className="relative z-10 w-full max-w-[390px] px-4">
        <div className="anim-down mb-8 flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 scale-150 blur-2xl opacity-25"
              style={{ background: "radial-gradient(circle, white, transparent)" }}
            />
            <AGLogoFull height={72} />
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold text-white/90" style={{ letterSpacing: "-0.025em" }}>
              AG Tech
            </p>
            <p
              className="text-[9px] text-white/25 tracking-[0.22em] uppercase mt-0.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Portal de Acesso
            </p>
          </div>
        </div>

        <div
          ref={cardRef}
          onMouseEnter={() => setCardHov(true)}
          onMouseLeave={() => setCardHov(false)}
          className="anim-up relative rounded-2xl border p-7 backdrop-blur-xl transition-all duration-400"
          style={{
            animationDelay: "120ms",
            background: cardHov
              ? `radial-gradient(500px circle at ${cardMouse.x * 100}% ${cardMouse.y * 100}%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)`
              : "rgba(255,255,255,0.025)",
            borderColor: cardHov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
          }}
        >
          {cardHov && (
            <div
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: `radial-gradient(160px circle at ${cardMouse.x * 100}% ${cardMouse.y * 100}%, rgba(255,255,255,0.055) 0%, transparent 70%)`,
              }}
            />
          )}

          <div className="mb-5">
            <h1 className="text-[18px] font-semibold text-white/90" style={{ letterSpacing: "-0.025em" }}>
              {mode === "signin" && "Bem-vindo de volta"}
              {mode === "signup" && "Criar sua conta"}
              {mode === "forgot" && "Recuperar senha"}
            </h1>
            <p className="text-[12px] text-white/28">
              {mode === "signin" && "Entre para acessar o painel"}
              {mode === "signup" && "Comece a gerenciar seu negócio em minutos"}
              {mode === "forgot" && "Enviaremos um link para redefinir sua senha"}
            </p>
          </div>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] py-2.5 text-[12px] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white/80 disabled:opacity-30 transition-all"
              >
                <GoogleIcon /> Continuar com Google
              </button>
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[9px] text-white/18" style={{ fontFamily: "var(--font-mono)" }}>
                  ou
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <FloatInput
                id="fullName"
                label="Nome completo"
                value={fullName}
                onChange={setFullName}
                autoComplete="name"
                required
              />
            )}
            <FloatInput
              id="email"
              label="E-mail"
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            {mode !== "forgot" && (
              <FloatInput
                id="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            )}

            {mode === "signin" && (
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] text-white/22">Lembrar acesso</span>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[11px] text-white/32 hover:text-white/60 transition-colors"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            <button
              ref={btnRef}
              type="submit"
              disabled={loading}
              onMouseMove={onMag}
              onMouseEnter={() => setMagOn(true)}
              onMouseLeave={() => {
                setMagOn(false);
                setMag({ x: 0, y: 0 });
              }}
              style={{
                transform: `translate(${mag.x}px,${mag.y}px)`,
                transition: magOn ? "transform 0.15s ease" : "transform 0.4s ease",
              }}
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13px] font-medium text-black hover:bg-white/88 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  {mode === "signin" && "Entrar"}
                  {mode === "signup" && "Criar conta"}
                  {mode === "forgot" && "Enviar link"}
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-150" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-1.5 text-center text-[11px] text-white/28">
            {mode === "signin" && (
              <div>
                Novo por aqui?{" "}
                <button onClick={() => setMode("signup")} className="text-white/50 hover:text-white/75 transition-colors">
                  Criar acesso
                </button>
              </div>
            )}
            {mode === "signup" && (
              <div>
                Já tem conta?{" "}
                <button onClick={() => setMode("signin")} className="text-white/50 hover:text-white/75 transition-colors">
                  Entrar
                </button>
              </div>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("signin")} className="text-white/40 hover:text-white/65 transition-colors">
                ← Voltar ao login
              </button>
            )}
          </div>
        </div>

        <p
          className="anim-up mt-4 text-center text-[9px] text-white/14"
          style={{ animationDelay: "220ms", fontFamily: "var(--font-mono)" }}
        >
          Dados protegidos · Conexão criptografada
        </p>
      </div>
    </div>
  );
}

function FloatInput({
  id,
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  ...rest
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type" | "id" | "placeholder">) {
  const [focused, setFocused] = useState(false);
  const up = focused || value.length > 0;
  return (
    <div
      className="relative rounded-xl border transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: focused ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(255,255,255,0.05)" : "none",
      }}
    >
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 transition-all duration-200"
        style={{
          top: up ? 8 : "50%",
          transform: up ? "none" : "translateY(-50%)",
          fontSize: up ? 10 : 13,
          color: up ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.22)",
          textTransform: up ? "uppercase" : "none",
          letterSpacing: up ? "0.06em" : 0,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ""}
        className="w-full bg-transparent px-4 pb-3 pt-6 text-[13px] text-white/90 outline-none placeholder:text-white/20"
        {...rest}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.12A6.98 6.98 0 0 1 5.47 12c0-.73.13-1.45.36-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
