import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Plus, Sliders } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { createMovement, listMovements, listProducts } from "@/lib/products.functions";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const productsOptions = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });
const movementsOptions = queryOptions({ queryKey: ["movements"], queryFn: () => listMovements() });

export const Route = createFileRoute("/_authenticated/app/estoque")({
  head: () => ({ meta: [{ title: "Estoque · AG Imports" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsOptions),
      context.queryClient.ensureQueryData(movementsOptions),
    ]);
  },
  component: Estoque,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Nada por aqui.</div>,
});

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

function Estoque() {
  const { data: products } = useSuspenseQuery(productsOptions);
  const { data: movements } = useSuspenseQuery(movementsOptions);
  const [open, setOpen] = useState(false);

  const totalUnits = products.reduce((a, p) => a + p.stock_qty, 0);
  const totalValue = products.reduce((a, p) => a + p.stock_qty * p.cost_cents, 0);
  const low = products.filter((p) => p.stock_qty <= p.min_stock && p.active);
  const activeSkus = products.filter((p) => p.active).length;

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Movimentações, saldo e alertas em tempo real"
        actions={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5" disabled={products.length === 0}>
            <Plus className="h-3.5 w-3.5" /> Nova movimentação
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="SKUs ativos" value={activeSkus.toString()} />
        <KpiCard label="Unidades" value={totalUnits.toString()} />
        <KpiCard label="Valor (custo)" value={brl(totalValue)} />
        <KpiCard label="Estoque baixo" value={low.length.toString()} icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {low.length > 0 && (
        <SectionCard
          title="Alertas de estoque baixo"
          description="Produtos abaixo ou no estoque mínimo"
          className="mt-4"
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {low.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">SKU {p.sku}</div>
                </div>
                <div className="tabular text-right text-xs">
                  <div className="font-semibold text-warning">{p.stock_qty}</div>
                  <div className="text-muted-foreground">mín {p.min_stock}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Histórico de movimentações" className="mt-4">
        {movements.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada.
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">Data</th>
                  <th className="px-4 py-2 font-medium">Produto</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Qtd</th>
                  <th className="px-4 py-2 font-medium">Observação</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: any) => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-accent/40">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{m.products?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{m.products?.sku}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          m.move_type === "in"
                            ? "bg-primary/10 text-primary"
                            : m.move_type === "out"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.move_type === "in" ? <ArrowUpRight className="h-3 w-3" /> :
                          m.move_type === "out" ? <ArrowDownRight className="h-3 w-3" /> :
                            <Sliders className="h-3 w-3" />}
                        {m.move_type === "in" ? "Entrada" : m.move_type === "out" ? "Saída" : "Ajuste"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular text-right font-medium">{m.qty}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {open && <MovementDialog products={products} onClose={() => setOpen(false)} />}
    </>
  );
}

function MovementDialog({
  products,
  onClose,
}: {
  products: Awaited<ReturnType<typeof listProducts>>;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>(products[0]?.id ?? "");
  const [moveType, setMoveType] = useState<"in" | "out" | "adjust">("in");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createMovement({
        data: { product_id: productId, move_type: moveType, qty, note: note || null },
      }),
    onSuccess: () => {
      toast.success("Movimentação registrada");
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-3"
        >
          <div>
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {p.sku} (saldo {p.stock_qty})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={moveType} onValueChange={(v) => setMoveType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada (adicionar unidades)</SelectItem>
                <SelectItem value="out">Saída (remover unidades)</SelectItem>
                <SelectItem value="adjust">Ajuste (definir saldo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{moveType === "adjust" ? "Novo saldo" : "Quantidade"}</Label>
            <Input
              type="number" min={0} required
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Observação</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending || !productId}>
              {mutation.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
