import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader, StatusPill } from "@/components/ui-bits";
import { brl } from "@/lib/mock/data";
import { Plus, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { listVendedores } from "@/lib/vendedores.functions";
import {
  createPedido,
  deletePedido,
  listPedidos,
  updatePedidoStatus,
} from "@/lib/pedidos.functions";

const STATUS = ["novo", "separacao", "expedicao", "entregue", "cancelado"] as const;
const STATUS_LABEL: Record<(typeof STATUS)[number], string> = {
  novo: "Novo",
  separacao: "Separação",
  expedicao: "Expedição",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
const CANAIS = ["site", "whatsapp", "marketplace", "loja", "outro"] as const;

type Status = (typeof STATUS)[number];
type Canal = (typeof CANAIS)[number];

const pedidosOptions = queryOptions({
  queryKey: ["pedidos"],
  queryFn: () => listPedidos(),
});

export const Route = createFileRoute("/_authenticated/app/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(pedidosOptions),
  component: Pedidos,
});

function Pedidos() {
  const { data: rows } = useSuspenseQuery(pedidosOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["pedidos"] });

  const { data: vendedores = [] } = useQuery({
    queryKey: ["vendedores"],
    queryFn: () => listVendedores(),
    staleTime: 60_000,
    retry: false,
  });
  const vendedoresAtivos = vendedores.filter((v) => v.ativo);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    cliente: "",
    vendedor_id: "",
    descricao: "",
    qty: 1,
    unit: 0,
    canal: "site" as Canal,
    status: "novo" as Status,
  });

  const create = useMutation({
    mutationFn: () =>
      createPedido({
        data: {
          cliente_nome_snapshot: form.cliente.trim(),
          vendedor_id: form.vendedor_id || null,
          status: form.status,
          canal: form.canal,
          itens: [
            {
              descricao_snapshot: form.descricao.trim(),
              qty: Number(form.qty) || 1,
              unit_price_cents: Math.round((Number(form.unit) || 0) * 100),
            },
          ],
        },
      }),
    onSuccess: () => {
      toast.success("Pedido criado");
      setOpen(false);
      setForm({ cliente: "", vendedor_id: "", descricao: "", qty: 1, unit: 0, canal: "site", status: "novo" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      updatePedidoStatus({ data: { id, status } }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["pedidos"] });
      const previous = qc.getQueryData(pedidosOptions.queryKey);
      qc.setQueryData(pedidosOptions.queryKey, (old) =>
        old ? old.map((p) => (p.id === id ? { ...p, status } : p)) : old,
      );
      return { previous };
    },
    onError: (e: Error, _vars, ctx) => {
      toast.error(e.message);
      if (ctx?.previous) qc.setQueryData(pedidosOptions.queryKey, ctx.previous);
    },
    onSettled: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePedido({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit() {
    if (!form.cliente.trim()) return toast.error("Informe o cliente");
    if (!form.descricao.trim()) return toast.error("Informe a descrição do item");
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Kanban do fluxo de expedição"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Novo pedido</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo pedido</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Cliente</Label>
                  <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} placeholder="Nome do cliente" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Vendedor</Label>
                  {vendedoresAtivos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum vendedor cadastrado. <Link to="/app/vendedores" className="underline underline-offset-2">Cadastrar vendedor</Link>
                    </p>
                  ) : (
                    <Select
                      value={form.vendedor_id || "nenhum"}
                      onValueChange={(v) => setForm({ ...form, vendedor_id: v === "nenhum" ? "" : v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Sem vendedor</SelectItem>
                        {vendedoresAtivos.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label>Descrição do item</Label>
                  <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Tênis modelo X (par)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Quantidade</Label><Input type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Valor unitário (R$)</Label><Input type="number" min={0} step="0.01" value={form.unit} onChange={(e) => setForm({ ...form, unit: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Canal</Label>
                    <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v as Canal })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={submit} disabled={create.isPending}>Criar pedido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {STATUS.map((col) => {
          const items = rows.filter((p) => p.status === col);
          const total = items.reduce((a, p) => a + p.total_cents, 0) / 100;
          return (
            <div key={col} className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <StatusPill status={STATUS_LABEL[col]} />
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <span className="tabular text-[11px] text-muted-foreground">{brl(total)}</span>
              </div>
              <div className="space-y-2 p-2">
                {items.map((p) => {
                  const nome = (p as any).clientes?.nome ?? p.cliente_nome_snapshot ?? "Sem cliente";
                  return (
                    <div key={p.id} className="group rounded-lg border border-border bg-background p-2.5 hover:border-primary/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="tabular font-medium">#{p.numero}</span>
                        <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="mt-1 truncate text-sm">{nome}</div>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground capitalize">{p.canal}</span>
                        <span className="tabular text-xs font-semibold text-primary">{brl(p.total_cents / 100)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Select value={p.status} onValueChange={(v) => move.mutate({ id: p.id, status: v as Status })}>
                          <SelectTrigger className="h-7 flex-1 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                        </Select>
                        <button onClick={() => del.mutate(p.id)} className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground opacity-0 transition hover:border-destructive/60 hover:text-destructive group-hover:opacity-100" aria-label="Remover">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">Sem pedidos</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
