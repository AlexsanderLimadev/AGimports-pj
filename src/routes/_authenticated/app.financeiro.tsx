import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KpiCard, PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
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
import { brl } from "@/lib/mock/data";
import {
  createLancamento,
  deleteLancamento,
  listLancamentos,
} from "@/lib/financeiro.functions";

type Lancamento = {
  id: string;
  tipo: "receita" | "despesa";
  categoria: string | null;
  descricao: string;
  valor_cents: number;
  data: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
};

const STATUS_LABEL: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Vencido",
  cancelado: "Cancelado",
};

const lancamentosOptions = queryOptions({
  queryKey: ["lancamentos"],
  queryFn: () => listLancamentos() as Promise<Lancamento[]>,
});

export const Route = createFileRoute("/_authenticated/app/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro · AG Imports" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(lancamentosOptions),
  component: Financeiro,
});

function Financeiro() {
  const { data: rows } = useSuspenseQuery(lancamentosOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["lancamentos"] });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "receita" as "receita" | "despesa",
    descricao: "",
    valor: 0,
    data: new Date().toISOString().slice(0, 10),
    status: "pendente" as Lancamento["status"],
    categoria: "",
  });

  const create = useMutation({
    mutationFn: () =>
      createLancamento({
        data: {
          tipo: form.tipo,
          descricao: form.descricao.trim(),
          categoria: form.categoria || null,
          valor_cents: Math.round(form.valor * 100),
          data: form.data,
          status: form.status,
        },
      }),
    onSuccess: () => {
      toast.success("Lançamento criado");
      setOpen(false);
      setForm({ ...form, descricao: "", valor: 0, categoria: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteLancamento({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    if (!form.descricao.trim()) return toast.error("Descrição obrigatória");
    create.mutate();
  }

  const receitas = rows.filter((r) => r.tipo === "receita" && r.status === "pago").reduce((a, r) => a + r.valor_cents, 0) / 100;
  const despesas = rows.filter((r) => r.tipo === "despesa" && r.status === "pago").reduce((a, r) => a + r.valor_cents, 0) / 100;
  const areceber = rows.filter((r) => r.tipo === "receita" && r.status === "pendente").reduce((a, r) => a + r.valor_cents, 0) / 100;
  const apagar = rows.filter((r) => r.tipo === "despesa" && r.status === "pendente").reduce((a, r) => a + r.valor_cents, 0) / 100;

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa e contas"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Novo lançamento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as "receita" | "despesa" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Lancamento["status"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Vencido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Descrição</Label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Valor (R$)</Label>
                    <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Categoria</Label>
                  <Input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="opcional" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit} disabled={create.isPending}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Saldo" value={brl(receitas - despesas)} />
        <KpiCard label="A receber" value={brl(areceber)} />
        <KpiCard label="A pagar" value={brl(apagar)} />
        <KpiCard label="Lançamentos" value={rows.length} />
      </div>

      <SectionCard title="Lançamentos" className="mt-4">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Valor</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="group border-b border-border/50 hover:bg-accent/40">
                  <td className="px-4 py-2.5 font-medium">{r.descricao}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">{r.tipo}</td>
                  <td className="px-4 py-2.5 text-xs">{r.data}</td>
                  <td className="px-4 py-2.5"><StatusPill status={STATUS_LABEL[r.status]} /></td>
                  <td className={`px-4 py-2.5 tabular text-right font-medium ${r.tipo === "receita" ? "text-primary" : "text-destructive"}`}>
                    {r.tipo === "receita" ? "+" : "-"}{brl(r.valor_cents / 100)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => del.mutate(r.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhum lançamento.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
