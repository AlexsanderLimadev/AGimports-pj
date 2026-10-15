import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KpiCard, PageHeader, SectionCard, EmptyState } from "@/components/ui-bits";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Globe, Truck } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/mock/data";
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "@/lib/fornecedores.functions";

type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_international: boolean;
  productCount: number;
  avgCostCents: number;
};

const EMPTY_FORM = { name: "", contact_name: "", phone: "", email: "", notes: "", is_international: false };

const suppliersOptions = queryOptions({
  queryKey: ["suppliers"],
  queryFn: () => listSuppliers() as Promise<Supplier[]>,
});

export const Route = createFileRoute("/_authenticated/app/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(suppliersOptions),
  component: Fornecedores,
});

function Fornecedores() {
  const { data: rows } = useSuspenseQuery(suppliersOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["suppliers"] });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const create = useMutation({
    mutationFn: () => createSupplier({ data: form }),
    onSuccess: () => {
      toast.success("Fornecedor cadastrado");
      close();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: () => updateSupplier({ data: { id: editing!.id, patch: form } }),
    onSuccess: () => {
      toast.success("Atualizado");
      close();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSupplier({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      notes: s.notes ?? "",
      is_international: s.is_international,
    });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function submit() {
    if (!form.name.trim()) return toast.error("Informe o nome do fornecedor");
    if (editing) update.mutate();
    else create.mutate();
  }

  const internacionais = rows.filter((r) => r.is_international).length;
  const comProduto = rows.filter((r) => r.productCount > 0);
  const menorCusto = comProduto.length
    ? comProduto.reduce((a, b) => (b.avgCostCents < a.avgCostCents ? b : a))
    : null;

  return (
    <>
      <PageHeader
        title="Fornecedores"
        description="Cadastro e comparação de custo por fornecedor"
        actions={
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Novo fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do fornecedor" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Contato</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid gap-1.5"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label>Observações</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Prazo de entrega, condições, etc." /></div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /> Fornecedor internacional</div>
                  <Switch checked={form.is_international} onCheckedChange={(v) => setForm({ ...form, is_international: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={close}>Cancelar</Button>
                <Button onClick={submit} disabled={create.isPending || update.isPending}>{editing ? "Salvar" : "Cadastrar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Fornecedores" value={rows.length} icon={<Truck className="h-4 w-4" />} />
        <KpiCard label="Internacionais" value={internacionais} icon={<Globe className="h-4 w-4" />} />
        <KpiCard label="Com produtos vinculados" value={comProduto.length} />
        <KpiCard label="Menor custo médio" value={menorCusto ? brl(menorCusto.avgCostCents / 100) : "-"} hint={menorCusto?.name} />
      </div>

      <SectionCard title="Todos os fornecedores" className="mt-4">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-4 w-4" />}
            title="Nenhum fornecedor cadastrado"
            description="Cadastre seu primeiro fornecedor pra começar a comparar custo entre eles."
            action={<Button size="sm" variant="outline" onClick={openNew}><Plus className="mr-1 h-3.5 w-3.5" />Novo fornecedor</Button>}
          />
        ) : (
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2 font-medium">Fornecedor</th>
                  <th className="px-4 py-2 font-medium">Contato</th>
                  <th className="px-4 py-2 font-medium">Origem</th>
                  <th className="px-4 py-2 text-right font-medium">Produtos</th>
                  <th className="px-4 py-2 text-right font-medium">Custo médio</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="group border-b border-border/50 hover:bg-accent/40">
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{s.name}</div>
                      {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                    </td>
                    <td className="px-4 py-2.5 text-xs">{s.contact_name || s.phone || "-"}</td>
                    <td className="px-4 py-2.5 text-xs">{s.is_international ? "Internacional" : "Nacional"}</td>
                    <td className="px-4 py-2.5 tabular text-right">{s.productCount}</td>
                    <td className="px-4 py-2.5 tabular text-right">{s.avgCostCents > 0 ? brl(s.avgCostCents / 100) : "-"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <button onClick={() => openEdit(s)} className="rounded-md p-1.5 hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => del.mutate(s.id)} className="rounded-md p-1.5 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}
