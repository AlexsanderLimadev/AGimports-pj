import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  Pagination,
  SectionCard,
  TableSkeleton,
} from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Trash2, Edit2, Download, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import {
  createCliente,
  deleteCliente,
  listClientes,
  updateCliente,
} from "@/lib/clientes.functions";
import { anonymizeCliente, exportClienteData } from "@/lib/lgpd.functions";
import { useDebouncedValue, usePagination } from "@/hooks/use-ui";
import { csvDate, downloadCsv, toCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/app/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · AG Imports" },
      { name: "description", content: "CRM de clientes da AG Imports com busca, exportação e LGPD." },
      { property: "og:title", content: "Clientes · AG Imports" },
      { property: "og:description", content: "Cadastro, segmentação e privacidade de clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Clientes,
});

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
};

function Clientes() {
  const qc = useQueryClient();
  const list = useServerFn(listClientes);
  const create = useServerFn(createCliente);
  const update = useServerFn(updateCliente);
  const remove = useServerFn(deleteCliente);
  const exportData = useServerFn(exportClienteData);
  const anonymize = useServerFn(anonymizeCliente);

  const { data, isPending } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => list() as Promise<Cliente[]>,
    staleTime: 30_000,
  });
  const rows = data ?? [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", documento: "", notes: "" });
  const [q, setQ] = useState("");
  const term = useDebouncedValue(q).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!term) return rows;
    return rows.filter((c) =>
      [c.nome, c.email, c.telefone, c.documento].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [rows, term]);
  const pg = usePagination(filtered, 50);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["clientes"] });

  const save = useMutation({
    mutationFn: async (payload: {
      nome: string;
      email: string | null;
      telefone: string | null;
      documento: string | null;
      notes: string | null;
      tags: string[];
    }) => {
      if (editing) return update({ data: { id: editing.id, patch: payload } });
      return create({ data: payload });
    },
    onSuccess: () => {
      toast.success(editing ? "Cliente atualizado" : "Cliente criado");
      setOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Cliente removido");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anon = useMutation({
    mutationFn: (id: string) => anonymize({ data: { cliente_id: id } }),
    onSuccess: () => {
      toast.success("Dados pessoais anonimizados (LGPD)");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditing(null);
    setForm({ nome: "", email: "", telefone: "", documento: "", notes: "" });
    setOpen(true);
  }
  function openEdit(c: Cliente) {
    setEditing(c);
    setForm({
      nome: c.nome,
      email: c.email ?? "",
      telefone: c.telefone ?? "",
      documento: c.documento ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  function submit() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    save.mutate({
      nome: form.nome.trim(),
      email: form.email || null,
      telefone: form.telefone || null,
      documento: form.documento || null,
      notes: form.notes || null,
      tags: [],
    });
  }

  function exportCsv() {
    downloadCsv(
      `clientes-${new Date().toISOString().slice(0, 10)}`,
      toCsv(filtered, [
        { header: "Nome", value: (c) => c.nome },
        { header: "E-mail", value: (c) => c.email ?? "" },
        { header: "Telefone", value: (c) => c.telefone ?? "" },
        { header: "Documento", value: (c) => c.documento ?? "" },
        { header: "Criado em", value: (c) => csvDate(c.created_at) },
      ]),
    );
  }

  async function exportTitular(c: Cliente) {
    try {
      const payload = await exportData({ data: { cliente_id: c.id } });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lgpd-${c.nome.replace(/\W+/g, "-").toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados do titular exportados");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="CRM de clientes"
        description="Cadastro, segmentação e privacidade"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-1 h-3.5 w-3.5" />
              CSV
            </Button>
            <Button size="sm" onClick={openNew}>
              <UserPlus className="mr-1 h-3.5 w-3.5" />
              Novo cliente
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Clientes" value={rows.length} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Com e-mail" value={rows.filter((c) => c.email).length} />
        <KpiCard label="Com telefone" value={rows.filter((c) => c.telefone).length} />
        <KpiCard
          label="Novos (30d)"
          value={
            rows.filter((c) => new Date(c.created_at) > new Date(Date.now() - 30 * 864e5)).length
          }
        />
      </div>

      <SectionCard
        title="Todos os clientes"
        className="mt-4"
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar cliente…"
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
        }
      >
        {isPending ? (
          <TableSkeleton rows={6} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-4 w-4" />}
            title={term ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
            description={
              term ? "Ajuste a busca e tente novamente." : "Cadastre o primeiro cliente da AG Imports."
            }
            action={
              !term && (
                <Button size="sm" onClick={openNew}>
                  <UserPlus className="mr-1 h-3.5 w-3.5" />
                  Novo cliente
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 font-medium">Cliente</th>
                    <th className="px-4 py-2 font-medium">Telefone</th>
                    <th className="px-4 py-2 font-medium">Documento</th>
                    <th className="px-4 py-2 font-medium">Criado</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {pg.pageRows.map((c) => (
                    <tr key={c.id} className="group border-b border-border/50 hover:bg-accent/40">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{c.nome}</div>
                        {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{c.telefone ?? "-"}</td>
                      <td className="px-4 py-2.5 text-xs">{c.documento ?? "-"}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => exportTitular(c)}
                            title="Exportar dados do titular (LGPD)"
                            aria-label="Exportar dados do titular"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Anonimizar os dados pessoais deste titular? Os pedidos e valores serão preservados, mas nome, e-mail, telefone e documento serão apagados de forma irreversível.",
                                )
                              )
                                anon.mutate(c.id);
                            }}
                            title="Anonimizar (LGPD)"
                            aria-label="Anonimizar titular"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            aria-label="Editar cliente"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Excluir cliente?")) del.mutate(c.id);
                            }}
                            aria-label="Excluir cliente"
                            className="text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pg.page}
              totalPages={pg.totalPages}
              from={pg.from}
              to={pg.to}
              total={pg.total}
              onPage={pg.setPage}
              label="clientes"
            />
          </>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>E-mail</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Documento</Label>
              <Input
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Notas</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
