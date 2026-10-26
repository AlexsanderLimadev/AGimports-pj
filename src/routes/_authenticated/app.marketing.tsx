import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { KpiCard, PageHeader, SectionCard } from "@/components/ui-bits";
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
import { brl } from "@/lib/mock/data";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createCampanha,
  deleteCampanha,
  listCampanhas,
} from "@/lib/marketing.functions";
import { avisarComDesfazer } from "@/lib/desfazer";

type Campanha = {
  id: string;
  nome: string;
  canal: string;
  status: string;
  budget_cents: number;
  gasto_cents: number;
  receita_cents: number;
};

const campanhasOptions = queryOptions({
  queryKey: ["campanhas"],
  queryFn: () => listCampanhas() as Promise<Campanha[]>,
});

export const Route = createFileRoute("/_authenticated/app/marketing")({
  head: () => ({ meta: [{ title: "Marketing · AG Tech" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(campanhasOptions),
  component: Marketing,
});

function Marketing() {
  const { data: rows } = useSuspenseQuery(campanhasOptions);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["campanhas"] });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    canal: "meta_ads",
    status: "ativa" as "rascunho" | "ativa" | "pausada" | "finalizada",
    budget: 0,
    gasto: 0,
    receita: 0,
  });

  const invest = rows.reduce((a, c) => a + c.gasto_cents, 0) / 100;
  const receita = rows.reduce((a, c) => a + c.receita_cents, 0) / 100;
  const roas = invest > 0 ? receita / invest : 0;

  const chartData = rows.map((c) => ({
    canal: c.nome,
    roas: c.gasto_cents > 0 ? c.receita_cents / c.gasto_cents : 0,
  }));

  const create = useMutation({
    mutationFn: () =>
      createCampanha({
        data: {
          nome: form.nome.trim(),
          canal: form.canal,
          status: form.status,
          budget_cents: Math.round(form.budget * 100),
          gasto_cents: Math.round(form.gasto * 100),
          receita_cents: Math.round(form.receita * 100),
        },
      }),
    onSuccess: () => {
      toast.success("Campanha criada");
      setOpen(false);
      setForm({ ...form, nome: "", budget: 0, gasto: 0, receita: 0 });
      invalidate();
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCampanha({ data: { id } }),
    onSuccess: (_d, id) => {
      avisarComDesfazer("Removida", "campanhas", id, invalidate, qc);
      invalidate(); },
  });

  function submit() {
    if (!form.nome.trim()) return toast.error("Nome obrigatório");
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Marketing"
        description="Performance de campanhas"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Nova campanha</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova campanha</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Nome</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Canal</Label>
                    <Select value={form.canal} onValueChange={(v) => setForm({ ...form, canal: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta_ads">Meta Ads</SelectItem>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
                        <SelectItem value="influencer">Influencer</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "rascunho" | "ativa" | "pausada" | "finalizada" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="pausada">Pausada</SelectItem>
                        <SelectItem value="finalizada">Finalizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5"><Label>Budget</Label><Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Gasto</Label><Input type="number" step="0.01" value={form.gasto} onChange={(e) => setForm({ ...form, gasto: Number(e.target.value) })} /></div>
                  <div className="grid gap-1.5"><Label>Receita</Label><Input type="number" step="0.01" value={form.receita} onChange={(e) => setForm({ ...form, receita: Number(e.target.value) })} /></div>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Investido" value={brl(invest)} />
        <KpiCard label="Receita" value={brl(receita)} />
        <KpiCard label="ROAS" value={`${roas.toFixed(2)}x`} />
        <KpiCard label="Lucro após ads" value={brl(receita - invest)} />
      </div>

      <SectionCard title="ROAS por campanha" className="mt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="color-mix(in oklab,var(--color-foreground) 6%,transparent)" vertical={false} />
              <XAxis dataKey="canal" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="roas" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard title="Campanhas" className="mt-4">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Gasto</th>
                <th className="px-4 py-2 text-right font-medium">Receita</th>
                <th className="px-4 py-2 text-right font-medium">ROAS</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const r = c.gasto_cents > 0 ? c.receita_cents / c.gasto_cents : 0;
                return (
                  <tr key={c.id} className="group border-b border-border/50 hover:bg-accent/40">
                    <td className="px-4 py-2.5 font-medium">{c.nome}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.canal}</td>
                    <td className="px-4 py-2.5 text-xs capitalize">{c.status}</td>
                    <td className="px-4 py-2.5 tabular text-right">{brl(c.gasto_cents / 100)}</td>
                    <td className="px-4 py-2.5 tabular text-right">{brl(c.receita_cents / 100)}</td>
                    <td className="px-4 py-2.5 tabular text-right text-primary">{r.toFixed(2)}x</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => del.mutate(c.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">Nenhuma campanha.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </>
  );
}
