import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { brl } from "@/lib/mock/data";
import { createVendedor, deleteVendedor, listVendedores, updateVendedor } from "@/lib/vendedores.functions";
import { normalizarNome } from "@/lib/vendedores-calc";
import { avisarComDesfazer } from "@/lib/desfazer";

type Vendedor = Awaited<ReturnType<typeof listVendedores>>[number];

const vendedoresOptions = queryOptions({
  queryKey: ["vendedores"],
  queryFn: () => listVendedores(),
});

export const Route = createFileRoute("/_authenticated/app/vendedores")({
  head: () => ({ meta: [{ title: "Vendedores · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(vendedoresOptions),
  component: Vendedores,
});

function Vendedores() {
  const { data: rows } = useSuspenseQuery(vendedoresOptions);
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["vendedores"] });
    qc.invalidateQueries({ queryKey: ["pedidos"] });
  };

  const [open, setOpen] = useState(false);
  const [editando, setEditando] = useState<Vendedor | null>(null);
  const [nome, setNome] = useState("");
  const [apagar, setApagar] = useState<Vendedor | null>(null);

  const nomeLimpo = normalizarNome(nome);
  const nomeErro = nomeLimpo.length === 0 ? "Informe o nome." : nomeLimpo.length > 120 ? "Máximo de 120 letras." : null;

  function fechar() {
    setOpen(false);
    setEditando(null);
    setNome("");
  }

  const salvar = useMutation({
    mutationFn: () =>
      editando
        ? updateVendedor({ data: { id: editando.id, nome: nomeLimpo } })
        : createVendedor({ data: { nome: nomeLimpo } }),
    onSuccess: () => {
      toast.success(editando ? "Vendedor atualizado" : "Vendedor cadastrado");
      fechar();
      invalidate();
    },
  });

  const alternar = useMutation({
    mutationFn: (v: Vendedor) => updateVendedor({ data: { id: v.id, ativo: !v.ativo } }),
    onSuccess: invalidate,
  });

  const remover = useMutation({
    mutationFn: (id: string) => deleteVendedor({ data: { id } }),
    onSuccess: (_d, id) => {
      avisarComDesfazer("Vendedor removido", "vendedores", id, invalidate, qc);
      setApagar(null);
      invalidate();
    },
  });

  const ativos = rows.filter((r) => r.ativo).length;

  return (
    <>
      <PageHeader
        title="Vendedores"
        description="Quem vende. O ranking do Dashboard Analítico usa este cadastro"
        actions={
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : fechar())}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { setEditando(null); setNome(""); setOpen(true); }}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Novo vendedor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editando ? "Editar vendedor" : "Novo vendedor"}</DialogTitle>
              </DialogHeader>
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!nomeErro && !salvar.isPending) salvar.mutate();
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="vend-nome">Nome</Label>
                  <Input id="vend-nome" value={nome} autoFocus maxLength={160} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" />
                  {nome.length > 0 && nomeErro && <p className="text-xs text-destructive">{nomeErro}</p>}
                  {editando && (
                    <p className="text-xs text-muted-foreground">
                      Ao renomear, os pedidos antigos deste vendedor passam a mostrar o nome novo.
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={fechar}>Cancelar</Button>
                  <Button type="submit" disabled={!!nomeErro || salvar.isPending}>
                    {editando ? "Salvar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Vendedores" value={String(rows.length)} />
        <KpiCard label="Ativos" value={String(ativos)} hint="Aparecem ao criar um pedido" />
        <KpiCard label="Vendas registradas" value={String(rows.reduce((a, r) => a + r.pedidos, 0))} hint="Pedidos válidos com vendedor" />
      </div>

      <SectionCard>
        {rows.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="h-4 w-4" />}
            title="Nenhum vendedor cadastrado"
            description="Cadastre quem vende para escolher o nome ao criar um pedido e ver o ranking no Dashboard Analítico."
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className={v.ativo ? "block truncate font-medium" : "block truncate font-medium text-muted-foreground"}>
                    {v.nome}
                  </span>
                  <span className="tabular text-xs text-muted-foreground">
                    {v.pedidos} pedido(s) · {brl(v.totalCents / 100)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    {v.ativo ? "Ativo" : "Inativo"}
                    <Switch checked={v.ativo} onCheckedChange={() => alternar.mutate(v)} aria-label={`Ativar ou desativar ${v.nome}`} />
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${v.nome}`}
                    onClick={() => { setEditando(v); setNome(v.nome); setOpen(true); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label={`Remover ${v.nome}`} onClick={() => setApagar(v)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <AlertDialog open={!!apagar} onOpenChange={(o) => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {apagar?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              O vendedor sai da lista de escolha. Os pedidos antigos continuam com o nome dele, e o ranking histórico não muda.
              Se quiser só parar de usar, prefira desativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => apagar && remover.mutate(apagar.id)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
