import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/ui-bits";
import {
  createProduct,
  deleteProduct,
  listCategories,
  listProducts,
  listSuppliers,
  updateProduct,
} from "@/lib/products.functions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const productsOptions = queryOptions({ queryKey: ["products"], queryFn: () => listProducts() });
const categoriesOptions = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const suppliersOptions = queryOptions({ queryKey: ["suppliers"], queryFn: () => listSuppliers() });

export const Route = createFileRoute("/_authenticated/app/produtos")({
  head: () => ({ meta: [{ title: "Produtos · AG Tech" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsOptions),
      context.queryClient.ensureQueryData(categoriesOptions),
      context.queryClient.ensureQueryData(suppliersOptions),
    ]);
  },
  component: ProdutosPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Nada por aqui.</div>,
});

const brl = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

type ProductRow = Awaited<ReturnType<typeof listProducts>>[number];

function ProdutosPage() {
  const { data: products } = useSuspenseQuery(productsOptions);
  const { data: categories } = useSuspenseQuery(categoriesOptions);
  const { data: suppliers } = useSuspenseQuery(suppliersOptions);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);
  const qc = useQueryClient();

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.barcode ?? "").toLowerCase().includes(term),
    );
  }, [products, q]);

  // Virtualização: com catálogos grandes (centenas de SKUs), renderizar
  // toda a tabela de uma vez trava a rolagem. Só desenha as linhas que
  // realmente estão visíveis na tela + uma margem (overscan), mantendo o
  // scroll leve independente de quantos produtos existirem.
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 45,
    overscan: 12,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end : 0;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const del = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto excluído");
      invalidate();
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${products.length} SKU${products.length === 1 ? "" : "s"} cadastrado${products.length === 1 ? "" : "s"}`}
        actions={
          <Button onClick={() => setCreating(true)} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo produto
          </Button>
        }
      />

      <SectionCard
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar SKU, nome, código de barras..."
              className="h-8 w-64 rounded-md border border-border bg-background pl-7 pr-2 text-xs focus:border-primary/50 focus:outline-none"
            />
          </div>
        }
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-sm text-muted-foreground">
              {q ? "Nenhum produto encontrado." : "Nenhum produto ainda."}
            </div>
            {!q && (
              <Button onClick={() => setCreating(true)} size="sm" className="mt-4 gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Adicionar primeiro produto
              </Button>
            )}
          </div>
        ) : (
          <div ref={scrollRef} className="-mx-4 max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Produto</th>
                  <th className="px-4 py-2 font-medium">Categoria</th>
                  <th className="px-4 py-2 text-right font-medium">Estoque</th>
                  <th className="px-4 py-2 text-right font-medium">Custo</th>
                  <th className="px-4 py-2 text-right font-medium">Preço</th>
                  <th className="px-4 py-2 text-right font-medium">Margem</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {paddingTop > 0 && (
                  <tr aria-hidden="true" style={{ height: paddingTop }}>
                    <td colSpan={9} />
                  </tr>
                )}
                {virtualRows.map((virtualRow) => {
                  const p = filtered[virtualRow.index];
                  const margem =
                    p.price_cents > 0 ? ((p.price_cents - p.cost_cents) / p.price_cents) * 100 : 0;
                  const low = p.stock_qty <= p.min_stock;
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-accent/40">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{p.name}</div>
                        {p.barcode && (
                          <div className="text-xs text-muted-foreground">{p.barcode}</div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        {(p as any).categories?.name ?? "-"}
                      </td>
                      <td
                        className={`px-4 py-2.5 tabular text-right ${low ? "text-destructive" : ""}`}
                      >
                        {p.stock_qty}
                      </td>
                      <td className="px-4 py-2.5 tabular text-right text-xs text-muted-foreground">
                        {brl(p.cost_cents)}
                      </td>
                      <td className="px-4 py-2.5 tabular text-right font-medium">
                        {brl(p.price_cents)}
                      </td>
                      <td className="px-4 py-2.5 tabular text-right text-xs text-primary">
                        {margem.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {p.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditing(p)}
                            className="rounded-md p-1.5 hover:bg-accent"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleting(p)}
                            className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr aria-hidden="true" style={{ height: paddingBottom }}>
                    <td colSpan={9} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {(creating || editing) && (
        <ProductDialog
          initial={editing}
          categories={categories}
          suppliers={suppliers}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={invalidate}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{deleting?.name}</b> será removido permanentemente, junto com todas as movimentações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && del.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductDialog({
  initial,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  initial: ProductRow | null;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    sku: initial?.sku ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    barcode: initial?.barcode ?? "",
    category_id: initial?.category_id ?? "",
    supplier_id: initial?.supplier_id ?? "",
    cost: initial ? initial.cost_cents / 100 : 0,
    price: initial ? initial.price_cents / 100 : 0,
    stock_qty: initial?.stock_qty ?? 0,
    min_stock: initial?.min_stock ?? 0,
    image_url: initial?.image_url ?? "",
    active: initial?.active ?? true,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description || null,
        barcode: form.barcode || null,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null,
        cost_cents: Math.round(form.cost * 100),
        price_cents: Math.round(form.price * 100),
        stock_qty: Math.round(form.stock_qty),
        min_stock: Math.round(form.min_stock),
        image_url: form.image_url || null,
        active: form.active,
      };
      if (initial) return updateProduct({ data: { id: initial.id, patch: payload } });
      return createProduct({ data: payload });
    },
    onSuccess: () => {
      toast.success(initial ? "Produto atualizado" : "Produto criado");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 grid grid-cols-3 gap-3">
            <div>
              <Label>SKU</Label>
              <Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              rows={2}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <Label>Código de barras</Label>
            <Input value={form.barcode ?? ""} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div>
            <Label>URL da imagem</Label>
            <Input
              value={form.image_url ?? ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select
              value={form.category_id || "none"}
              onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fornecedor</Label>
            <Select
              value={form.supplier_id || "none"}
              onValueChange={(v) => setForm({ ...form, supplier_id: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Custo (R$)</Label>
            <Input
              type="number" step="0.01" min="0"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Preço (R$)</Label>
            <Input
              type="number" step="0.01" min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Estoque inicial</Label>
            <Input
              type="number" min="0" disabled={!!initial}
              value={form.stock_qty}
              onChange={(e) => setForm({ ...form, stock_qty: parseInt(e.target.value) || 0 })}
            />
            {initial && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ajuste pela tela de Estoque.
              </p>
            )}
          </div>
          <div>
            <Label>Estoque mínimo</Label>
            <Input
              type="number" min="0"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-border bg-background p-3">
            <div>
              <div className="text-sm font-medium">Produto ativo</div>
              <div className="text-xs text-muted-foreground">Exibir em relatórios e alertas.</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : initial ? "Salvar alterações" : "Criar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
