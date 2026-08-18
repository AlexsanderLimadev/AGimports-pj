import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ag-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      // Se localStorage não estiver disponível (ex.: navegação privada
      // bloqueando), simplesmente não mostra o banner em vez de quebrar.
    }
  }, []);

  function choose(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // idem — falha em salvar não deve travar a interação do usuário
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 p-4 backdrop-blur-md sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border sm:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Usamos cookies essenciais para manter você conectado e lembrar suas preferências.
            Veja mais na{" "}
            <Link to="/privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => choose("accepted")}>
              Entendi
            </Button>
            <Button size="sm" variant="outline" onClick={() => choose("rejected")}>
              Só o essencial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
