import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { brl } from "@/lib/mock/data";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  addEtapa, deleteEtapa, deleteFunil, getFunil,
} from "@/lib/funis.functions";

export const Route = createFileRoute("/_authenticated/app/funis/$id")({
  head: ({ params }) => ({ meta: [{ title: `Funil · AG Imports` }] }),
  component: Editor,
});

type Etapa = { id: string; ordem: number; nome: string; pessoas: number; conv: number; valor_cents: number; cor: string | null };
type Funil = { id: string; nome: string; slug: string; etapas: Etapa[] };

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getFunil);
  const addFn = useServerFn(addEtapa);
  const delEtapaFn = useServerFn(deleteEtapa);
  const delFunilFn = useServerFn(deleteFunil);

  const [f, setF] = useState<Funil | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", pessoas: 100, conv: 40, valor: 0 });

  const reload = useCallback(async () => {
    try {
      const res = await getFn({ data: { id } });
      setF(res as Funil);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }, [getFn, id]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!f) {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-border p-16 text-center">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Funil não encontrado.</p>
          <Link to="/app/funis" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  const entrada = f.etapas[0]?.pessoas ?? 0;
  const saida = f.etapas[f.etapas.length - 1]?.pessoas ?? 0;
  const receita = f.etapas.reduce((a, e) => a + e.valor_cents, 0) / 100;
  const convTotal = entrada ? ((saida / entrada) * 100).toFixed(1) : "0.0";

  async function addEtapaFn() {
    if (!form.nome.trim()) return toast.error("Informe o nome da etapa");
    try {
      await addFn({
        data: {
          funil_id: f!.id,
          etapa: {
            nome: form.nome.trim(),
            pessoas: Number(form.pessoas) || 0,
            conv: Number(form.conv) || 0,
            valor_cents: Math.round((Number(form.valor) || 0) * 100),
          },
        },
      });
      setForm({ nome: "", pessoas: 100, conv: 40, valor: 0 });
      setOpen(false);
      toast.success("Etapa adicionada");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function removeEtapa(eid: string) {
    try { await delEtapaFn({ data: { id: eid } }); toast.success("Removida"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  }

  async function removeFunil() {
    if (!confirm("Excluir funil?")) return;
    try {
      await delFunilFn({ data: { id: f!.id } });
      toast.success("Funil removido");
      navigate({ to: "/app/funis" });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title={f.nome}
        description="Edite etapas, conversões e valores"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={removeFunil}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
            <Link to="/app/funis" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/40">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-[11px] text-muted-foreground">Entrada</div><div className="tabular mt-1 text-xl font-semibold">{entrada.toLocaleString("pt-BR")}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-[11px] text-muted-foreground">Conversão</div><div className="tabular mt-1 text-xl font-semibold text-primary">{convTotal}%</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-[11px] text-muted-foreground">Receita</div><div className="tabular mt-1 text-xl font-semibold">{brl(receita)}</div></div>
        <div className="rounded-xl border border-border bg-card p-4"><div className="text-[11px] text-muted-foreground">Etapas</div><div className="tabular mt-1 text-xl font-semibold">{f.etapas.length}</div></div>
      </div>

      <SectionCard
        title="Etapas do funil"
        className="mt-4"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nova etapa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova etapa</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Checkout" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label>Pessoas</Label><Input type="number" value={form.pessoas} onChange={(e) => setForm({ ...form, pessoas: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Conv. %</Label><Input type="number" value={form.conv} onChange={(e) => setForm({ ...form, conv: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={addEtapaFn}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {f.etapas.map((e, i) => {
            const width = entrada ? (e.pessoas / entrada) * 100 : 0;
            return (
              <div key={e.id} className="group w-64 shrink-0 rounded-xl border border-border bg-background p-4 transition hover:border-primary/40">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Etapa {i + 1}</span>
                  <button onClick={() => removeEtapa(e.id)} className="opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Remover"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="mt-1 text-sm font-semibold">{e.nome}</div>
                <div className="mt-3 h-1.5 w-full rounded-full" style={{ background: "color-mix(in oklab, var(--color-foreground) 6%, transparent)" }}>
                  <div className="h-full rounded-full" style={{ width: `${width}%`, background: e.cor ?? "var(--color-primary)" }} />
                </div>
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Pessoas</span><span className="tabular font-medium">{e.pessoas.toLocaleString("pt-BR")}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Conversão</span><span className="tabular font-medium text-primary">{e.conv.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="tabular font-medium">{e.valor_cents > 0 ? brl(e.valor_cents / 100) : "—"}</span></div>
                </div>
              </div>
            );
          })}
          {f.etapas.length === 0 && (
            <div className="w-full rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">Nenhuma etapa. Clique em "Nova etapa" para começar.</div>
          )}
        </div>
      </SectionCard>
    </>
  );
}
