import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createFunil, deleteFunil, listFunis } from "@/lib/funis.functions";
import { avisarComDesfazer } from "@/lib/desfazer";

type Etapa = { id: string; ordem: number; nome: string; pessoas: number; conv: number; valor_cents: number; cor: string | null };
type Funil = { id: string; nome: string; slug: string; etapas: Etapa[] };

const funisOptions = queryOptions({
  queryKey: ["funis"],
  queryFn: () => listFunis() as Promise<Funil[]>,
});

export const Route = createFileRoute("/_authenticated/app/funis/")({
  head: () => ({ meta: [{ title: "Funis · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(funisOptions),
  component: Funis,
});

const TEMPLATES: Record<string, { nome: string; etapas: string[] }> = {
  "E-commerce clássico": { nome: "E-commerce clássico", etapas: ["Visitantes", "Cliques", "Carrinho", "Checkout", "Compra"] },
  "Atacado B2B": { nome: "Atacado B2B", etapas: ["Contatos", "Qualificados", "Orçamento", "Fechados"] },
  Lançamento: { nome: "Lançamento", etapas: ["Awareness", "Lista de espera", "Pré-venda", "Compra"] },
  Recuperação: { nome: "Recuperação", etapas: ["Carrinho abandonado", "Email 1", "Email 2", "Recuperados"] },
};

function Funis() {
  const { data: rows } = useSuspenseQuery(funisOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["funis"] });
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const navigate = useNavigate();

  const create = useMutation({
    mutationFn: (template?: string) => {
      const tpl = template ? TEMPLATES[template] : null;
      const displayNome = (tpl?.nome ?? nome).trim();
      if (!displayNome) throw new Error("Informe o nome do funil");
      const etapaNomes = tpl?.etapas ?? ["Visitantes", "Leads", "Compra"];
      return createFunil({
        data: {
          nome: displayNome,
          etapas: etapaNomes.map((n, i) => ({
            nome: n,
            pessoas: Math.max(100, 1000 - i * 250),
            conv: i === 0 ? 100 : 40,
            valor_cents: 0,
          })),
        },
      });
    },
    onSuccess: (res) => {
      setNome("");
      setOpen(false);
      toast.success("Funil criado");
      invalidate();
      navigate({ to: "/app/funis/$id", params: { id: res.id } });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFunil({ data: { id } }),
    onSuccess: (_d, id) => {
      avisarComDesfazer("Removido", "funis", id, invalidate, qc);
      invalidate(); },
  });

  function createFunnel(template?: string) {
    create.mutate(template);
  }

  return (
    <>
      <PageHeader
        title="Funis de venda"
        description="Construtor visual"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Novo funil</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo funil</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Nome</Label>
                  <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Funil Black Friday" onKeyDown={(e) => e.key === "Enter" && createFunnel()} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => createFunnel()}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((f) => {
          const entrada = f.etapas[0]?.pessoas ?? 0;
          const saida = f.etapas[f.etapas.length - 1]?.pessoas ?? 0;
          const conv = entrada ? ((saida / entrada) * 100).toFixed(1) : "0.0";
          return (
            <div key={f.id} className="group relative rounded-xl border border-border bg-card p-5 transition hover:border-primary/40">
              <Link to="/app/funis/$id" params={{ id: f.id }} className="absolute inset-0 rounded-xl" aria-label={`Abrir ${f.nome}`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{f.etapas.length} etapas</div>
                  <div className="mt-1 text-lg font-semibold">{f.nome}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); del.mutate(f.id); }}
                    className="relative z-10 grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground opacity-0 transition hover:border-destructive/60 hover:text-destructive group-hover:opacity-100"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><GitBranch className="h-4 w-4" /></div>
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-3">
                <div><div className="text-[11px] text-muted-foreground">Entrada</div><div className="tabular text-sm font-semibold">{entrada.toLocaleString("pt-BR")}</div></div>
                <div><div className="text-[11px] text-muted-foreground">Conversão</div><div className="tabular text-sm font-semibold text-primary">{conv}%</div></div>
                <div><div className="text-[11px] text-muted-foreground">Saída</div><div className="tabular text-sm font-semibold">{saida}</div></div>
              </div>
              <div className="relative mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
                {f.etapas.map((e) => (
                  <div key={e.id} style={{ flex: e.pessoas || 1, background: e.cor ?? "var(--color-primary)" }} className="opacity-80" />
                ))}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum funil ainda. Crie um do zero ou use um template abaixo.
          </div>
        )}
      </div>

      <SectionCard title="Templates" description="Comece com um modelo pronto" className="mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Object.keys(TEMPLATES).map((t) => (
            <button key={t} onClick={() => createFunnel(t)} className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs transition hover:border-primary/40 hover:bg-accent/40">
              <div className="font-medium">{t}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Usar template</div>
            </button>
          ))}
        </div>
      </SectionCard>
    </>
  );
}
