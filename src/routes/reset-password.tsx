import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AGLogo, Grain, Grid, useMouseRel } from "@/components/brand-fx";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha · AG Imports" }] }),
  component: ResetPassword,
});

const BG_URL =
  "https://images.unsplash.com/photo-1671159593357-ee577a598f71?w=1920&h=1080&fit=crop&auto=format&q=80";

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const mousePos = useMouseRel(pageRef);

  useEffect(() => {
    // Supabase attaches the recovery session automatically from the URL hash.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada. Faça login novamente.");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
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
          <AGLogo size={56} />
          <p className="text-[15px] font-semibold text-white/90" style={{ letterSpacing: "-0.025em" }}>
            AG Imports
          </p>
        </div>

        <div
          className="anim-up rounded-2xl border p-7 backdrop-blur-xl"
          style={{ animationDelay: "120ms", background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <h1 className="text-[16px] font-semibold text-white/90" style={{ letterSpacing: "-0.025em" }}>
            Definir nova senha
          </h1>
          <p className="mt-1 text-[12px] text-white/28">
            {ready
              ? "Escolha uma senha forte com pelo menos 8 caracteres."
              : "Aguardando validação do link de recuperação…"}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border px-4 text-[13px] text-white/90 outline-none placeholder:text-white/25 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            />
            <input
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-11 w-full rounded-xl border px-4 text-[13px] text-white/90 outline-none placeholder:text-white/25 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            />
            <button
              type="submit"
              disabled={loading || !ready}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-medium text-black hover:bg-white/88 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar nova senha
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
