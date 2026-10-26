import { useEffect, useState } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui-bits";
import { getConfigNegocio, saveConfigNegocio } from "@/lib/config-negocio.functions";
import { CONFIG_ALERTAS_PADRAO } from "@/lib/alertas-calc";

const configOptions = queryOptions({
  queryKey: ["config-negocio"],
  queryFn: () => getConfigNegocio(),
});

/** Limites que decidem quando o sistema avisa sobre margem baixa e estoque parado. */
export function AlertasConfig() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(configOptions);
  const [margem, setMargem] = useState("");
  const [dias, setDias] = useState("");

  useEffect(() => {
    if (!data) return;
    setMargem(String(data.margemMinimaPct));
    setDias(String(data.diasEstoqueParado));
  }, [data]);

  const margemNum = margem.trim() === "" ? NaN : Number(margem.replace(",", "."));
  const diasNum = dias.trim() === "" ? NaN : Number(dias);
  const margemErro = !Number.isFinite(margemNum) || margemNum < 0 || margemNum > 100 ? "Use um valor entre 0 e 100." : null;
  const diasErro = !Number.isInteger(diasNum) || diasNum < 1 || diasNum > 3650 ? "Use um número inteiro de 1 a 3650." : null;

  const salvar = useMutation({
    mutationFn: () => saveConfigNegocio({ data: { margemMinimaPct: margemNum, diasEstoqueParado: diasNum } }),
    onSuccess: (novo) => {
      qc.setQueryData(configOptions.queryKey, novo);
      qc.invalidateQueries({ queryKey: ["alertas-negocio"] });
      toast.success("Limites salvos");
    },
  });

  const atual = data ?? CONFIG_ALERTAS_PADRAO;
  const mudou = margemNum !== atual.margemMinimaPct || diasNum !== atual.diasEstoqueParado;
  const podeSalvar = !margemErro && !diasErro && mudou && !salvar.isPending;

  return (
    <SectionCard title="Alertas do negócio" description="Defina quando o sistema deve te avisar">
      <form
        className="grid gap-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (podeSalvar) salvar.mutate();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="cfg-margem">Margem mínima (%)</Label>
          <Input
            id="cfg-margem"
            inputMode="decimal"
            value={margem}
            disabled={isLoading}
            onChange={(e) => setMargem(e.target.value)}
            aria-invalid={!!margemErro}
          />
          <p className={margemErro ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {margemErro ?? "Produtos com margem abaixo disso aparecem em Alertas."}
          </p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cfg-dias">Dias sem venda para considerar estoque parado</Label>
          <Input
            id="cfg-dias"
            inputMode="numeric"
            value={dias}
            disabled={isLoading}
            onChange={(e) => setDias(e.target.value)}
            aria-invalid={!!diasErro}
          />
          <p className={diasErro ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {diasErro ?? "Produto com estoque e sem venda por esse tempo vira alerta."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={!podeSalvar}>
            {salvar.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Salvar limites
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setMargem(String(CONFIG_ALERTAS_PADRAO.margemMinimaPct));
              setDias(String(CONFIG_ALERTAS_PADRAO.diasEstoqueParado));
            }}
          >
            Restaurar padrão
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
