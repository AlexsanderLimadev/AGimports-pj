import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createMeta, deleteMeta, listMetas } from "@/lib/metas.functions";

type Meta = {
  id: string;
  nome: string;
  tipo: "faturamento" | "pedidos" | "clientes" | "lucro" | "ticket_medio";
  periodo: "mes" | "trimestre" | "ano";
  alvo: number;
  atual: number;
  starts_at: string;
  ends_at: string | null;
};

const TIPO_LABEL: Record<Meta["tipo"], { label: string; unit: string }> = {
  faturamento: { label: "Faturamento", unit: "R$" },
  pedidos: { label: "Pedidos", unit: "" },
  clientes: { label: "Clientes novos", unit: "" },
  lucro: { label: "Lucro", unit: "R$" },
  ticket_medio: { label: "Ticket médio", unit: "R$" },
};

const metasOptions = queryOptions({
  queryKey: ["metas"],
  queryFn: () => listMetas() as Promise<Meta[]>,
});

export const Route = createFileRoute("/_authenticated/app/metas")({
  head: () => ({ meta: [{ title: "Metas · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(metasOptions),
  component: Metas,
});

function Ring({ progress }: { progress: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(progress, 100) / 100) * c;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
      <circle cx="40" cy="40" r={r} strokeWidth="6" className="fill-none stroke-muted" />
      <circle cx="40" cy="40" r={r} strokeWidth="6" className="fill-none stroke-primary transition-all" strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

function Metas() {
  const { data: rows } = useSuspenseQuery(metasOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["metas"] });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "faturamento" as Meta["tipo"],
    periodo: "mes" as Meta["periodo"],
    alvo: 0,
    starts_at: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  });

  const create = useMutation({
    mutationFn: () => createMeta({ data: { ...form, nome: form.nome.trim() } }),
    onSuccess: () => {
      toast.success("Meta criada");
      setOpen(false);
      setForm({ ...form, nome: "", alvo: 0 });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMeta({ data: { id } }),
    onSuccess: () => {
      toast.success("Removida");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    if (form.alvo <= 0) return toast.error("Meta deve ser > 0");
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Metas"
        description="Progresso calculado em tempo real"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nova meta</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Meta["tipo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPO_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Período</Label>
                    <Select value={form.periodo} onValueChange={(v) => setForm({ ...form, periodo: v as Meta["periodo"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mes">Mês</SelectItem>
                        <SelectItem value="trimestre">Trimestre</SelectItem>
                        <SelectItem value="ano">Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Alvo</Label><Input type="number" value={form.alvo} onChange={(e) => setForm({ ...form, alvo: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Início</Label><Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit} disabled={create.isPending}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((m) => {
          const p = m.alvo > 0 ? (m.atual / m.alvo) * 100 : 0;
          const info = TIPO_LABEL[m.tipo];
          return (
            <div key={m.id} className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="relative">
                <Ring progress={p} />
                <div className="tabular absolute inset-0 grid place-items-center text-xs font-semibold">{p.toFixed(0)}%</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-muted-foreground">{m.nome}</div>
                  <button onClick={() => del.mutate(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="tabular mt-1 text-lg font-semibold">
                  {info.unit && `${info.unit} `}{m.atual.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  <span className="text-xs text-muted-foreground"> / {info.unit && `${info.unit} `}{m.alvo.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(p, 100)}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground capitalize">{info.label} · {m.periodo}</div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <SectionCard className="sm:col-span-2 lg:col-span-3"><p className="text-center text-xs text-muted-foreground py-4">Nenhuma meta criada.</p></SectionCard>
        )}
      </div>
    </>
  );
}
