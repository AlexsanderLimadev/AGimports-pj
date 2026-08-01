import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAutomacao,
  deleteAutomacao,
  listAutomacoes,
  toggleAutomacao,
} from "@/lib/automacoes.functions";

export const Route = createFileRoute("/_authenticated/app/automacoes")({
  head: () => ({ meta: [{ title: "Automações · AG Imports" }] }),
  component: Auto,
});

type Automacao = {
  id: string;
  nome: string;
  gatilho: string;
  acao: string;
  ativo: boolean;
};

function Auto() {
  const list = useServerFn(listAutomacoes);
  const create = useServerFn(createAutomacao);
  const toggle = useServerFn(toggleAutomacao);
  const remove = useServerFn(deleteAutomacao);
  const [rows, setRows] = useState<Automacao[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", gatilho: "", acao: "" });

  async function reload() {
    try { setRows((await list()) as Automacao[]); }
    catch (e) { toast.error((e as Error).message); }
  }
  useEffect(() => { reload(); }, []);

  async function submit() {
    if (!form.nome.trim() || !form.gatilho.trim() || !form.acao.trim()) return toast.error("Preencha todos os campos");
    try {
      await create({ data: { ...form, ativo: true, config: {} } });
      toast.success("Regra criada");
      setOpen(false);
      setForm({ nome: "", gatilho: "", acao: "" });
      reload();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onToggle(id: string, ativo: boolean) {
    setRows((prev) => prev.map((a) => (a.id === id ? { ...a, ativo } : a)));
    try { await toggle({ data: { id, ativo } }); }
    catch (e) { toast.error((e as Error).message); reload(); }
  }

  async function del(id: string) {
    try { await remove({ data: { id } }); toast.success("Removida"); reload(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <PageHeader
        title="Automações"
        description="Gatilhos e ações"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nova regra</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova regra</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Gatilho</Label><Input value={form.gatilho} onChange={(e) => setForm({ ...form, gatilho: e.target.value })} placeholder="Ex: Novo pedido criado" /></div>
                <div className="grid gap-1.5"><Label>Ação</Label><Input value={form.acao} onChange={(e) => setForm({ ...form, acao: e.target.value })} placeholder="Ex: Enviar WhatsApp de confirmação" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <SectionCard title="Regras">
        <div className="divide-y divide-border">
          {rows.map((a) => (
            <div key={a.id} className="group flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <Zap className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.nome}</div>
                  <div className="text-[11px] text-muted-foreground">{a.gatilho} → {a.acao}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={a.ativo} onCheckedChange={(v) => onToggle(a.id, v)} />
                <button onClick={() => del(a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Nenhuma automação.</p>}
        </div>
      </SectionCard>
    </>
  );
}
