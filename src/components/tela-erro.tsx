import { useMemo } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { interpretarErro } from "@/lib/erros-calc";

/**
 * Tela de erro limpa, em português, com código de referência.
 * `inteira` ocupa a janela toda (erro fora do app); sem ela, cabe dentro do layout.
 */
export function TelaErro({
  error,
  reset,
  inteira = false,
}: {
  error: unknown;
  reset?: () => void;
  inteira?: boolean;
}) {
  const router = useRouter();
  const r = useMemo(() => interpretarErro(error), [error]);

  return (
    <div className={inteira ? "flex min-h-screen items-center justify-center bg-background px-4" : "flex min-h-[50vh] items-center justify-center px-4"}>
      <div role="alert" className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full border border-border">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">Algo deu errado aqui</h1>
        <p className="mt-2 text-sm text-muted-foreground">{r.mensagem}</p>
        {r.codigo && (
          <p className="mt-2 text-xs text-muted-foreground">
            Código de referência: <span className="tabular font-medium text-foreground">{r.codigo}</span>
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset?.();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar de novo
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
