import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import { restaurarRegistro, type TabelaRestauravel } from "@/lib/restaurar.functions";
import { TELAS_DERIVADAS } from "@/lib/telas-derivadas";
import { notificarErro } from "@/lib/notificar-erro";

/**
 * Aviso de "apagado" com botão Desfazer por alguns segundos.
 * `atualizar` refaz a lista da tela; as telas de resumo são refeitas aqui.
 */
export function avisarComDesfazer(
  mensagem: string,
  tabela: TabelaRestauravel,
  id: string,
  atualizar: () => void,
  qc: QueryClient,
): void {
  toast.success(mensagem, {
    duration: 7000,
    action: {
      label: "Desfazer",
      onClick: async () => {
        try {
          await restaurarRegistro({ data: { tabela, id } });
          atualizar();
          for (const chave of TELAS_DERIVADAS) qc.invalidateQueries({ queryKey: [chave] });
          toast.success("Restaurado");
        } catch (e) {
          notificarErro(e);
        }
      },
    },
  });
}
