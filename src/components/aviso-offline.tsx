import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Faixa discreta no topo quando o navegador perde a internet. Some sozinha ao voltar. */
export function AvisoOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 border-b border-border bg-foreground px-3 py-1.5 text-xs text-background"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      Você está sem internet. Alterações feitas agora não serão salvas.
    </div>
  );
}
