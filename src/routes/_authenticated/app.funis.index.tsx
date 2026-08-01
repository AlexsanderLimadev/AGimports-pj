import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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

export const Route = createFileRoute("/_authenticated/app/funis/")({
  head: () => ({ meta: [{ title: "Funis · AG Imports" }] }),
  component: Funis,
});

type Etapa = { id: string; ordem: number; nome: string; pessoas: number; conv: number; valor_cents: number; cor: string | null };
type Funil = { id: string; nome: string; slug: string; etapas: Etapa[] };

const TEMPLATES: Record<string, { nome: string; etapas: string[] }> = {
  "E-commerce clássico": { nome: "E-commerce clássico", etapas: ["Visitantes", "Cliques", "Carrinho", "Checkout", "Compra"] },
  "Atacado B2B": { nome: "Atacado B2B", etapas: ["Contatos", "Qualificados", "Orçamento", "Fechados"] },
  Lançamento: { nome: "Lançamento", etapas: ["Awareness", "Lista de espera", "Pré-venda", "Compra"] },
  Recuperação: { nome: "Recuperação", etapas: ["Carrinho abandonado", "Email 1", "Email 2", "Recuperados"] },
};

function Funis() {
  const list = useServerFn(listFunis);
  const create = useServerFn(createFunil);
  const remove = useServerFn(deleteFunil);
  const [rows, setRows] = useState<Funil[]>([]);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const navigate = useNavigate();

  async function reload() {
    try { setRows((await list()) as Funil[]); }
    catch (e) { toast.error((e as Error).message); }
  }
  useEffect(() => { reload(); }, []);

  async function createFunnel(template?: string) {
    const tpl = template ? TEMPLATES[template] : null;
    const displayNome = (tpl?.nome ?? nome).trim();
    if (!displayNome) return toast.error("Informe o nome do funil");
    const etapaNomes = tpl?.etapas ?? ["Visitantes", "Leads", "Compra"];
    try {
      const res = await create({
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
      setNome("");
      setOpen(false);
      toast.success("Funil criado");
      navigate({ to: "/app/funis/$id", params: { id: res.id } });
    } catch (e) { toast.error((e as Error).message); }
  }

  async function del(id: string) {
    try { await remove({ data: { id } }); toast.success("Removido"); reload(); }
    catch (e) { toast.error((e as Error).message); }
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
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); del(f.id); }}
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
