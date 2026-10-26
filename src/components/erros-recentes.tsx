import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { limparErros, listErros } from "@/lib/erros-app.functions";
import { interpretarErro } from "@/lib/erros-calc";
import { notificarErro } from "@/lib/notificar-erro";

const TIPO_LABEL: Record<string, string> = {
  sessao: "Sessão",
  duplicado: "Duplicado",
  vinculo: "Vínculo",
  permissao: "Permissão",
  campos: "Campos",
  rede: "Conexão",
  limite: "Limite",
  banco: "Banco",
  generico: "Outro",
};

/** Lista os erros que apareceram para você (ou para todos, se você for administrador). */
export function ErrosRecentes() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const { data, error, isPending } = useQuery({
    queryKey: ["erros-app"],
    queryFn: () => listErros(),
    enabled: aberto,
    retry: false,
    staleTime: 15_000,
  });
  const limpar = useMutation({
    mutationFn: () => limparErros(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["erros-app"] }),
    onError: (e) => notificarErro(e),
  });

  const linhas = data?.linhas ?? [];
  const meuId = data?.meuId;
  const deOutros = linhas.some((l) => l.user_id !== meuId);

  return (
    <SectionCard
      title="Erros recentes"
      description="Os últimos erros (30 dias). Procure o código no log do servidor para ver o detalhe técnico"
      className="mt-4"
    >
      {!aberto ? (
        <div className="p-4">
          <Button variant="outline" size="sm" onClick={() => setAberto(true)}>
            Ver erros recentes
          </Button>
        </div>
      ) : isPending ? (
        <p className="p-4 text-xs text-muted-foreground">Carregando…</p>
      ) : error ? (
        <p className="p-4 text-xs text-muted-foreground">
          {interpretarErro(error).tipo === "banco"
            ? "O painel ainda não foi ativado no banco. Rode o SQL 20261026_erros_app.sql no Supabase."
            : interpretarErro(error).mensagem}
        </p>
      ) : linhas.length === 0 ? (
        <p className="p-4 text-xs text-muted-foreground">Nenhum erro registrado. Bom sinal.</p>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {linhas.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-xs">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{l.mensagem}</span>
                  <span className="text-muted-foreground">
                    {l.tela}
                    {deOutros && ` · ${l.user_id === meuId ? "você" : `usuário ${l.user_id.slice(0, 4)}`}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="tabular block font-medium">{l.codigo}</span>
                  <span className="text-muted-foreground">
                    {TIPO_LABEL[l.tipo] ?? l.tipo} · {formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end border-t border-border p-3">
            <Button variant="outline" size="sm" disabled={limpar.isPending} onClick={() => limpar.mutate()}>
              Limpar os meus
            </Button>
          </div>
        </>
      )}
    </SectionCard>
  );
}
