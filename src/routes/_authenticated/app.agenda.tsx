import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  createEvento,
  deleteEvento,
  listEventos,
} from "@/lib/agenda.functions";

export const Route = createFileRoute("/_authenticated/app/agenda")({
  head: () => ({ meta: [{ title: "Agenda · AG Imports" }] }),
  loader: ({ context }) => {
    const d = new Date();
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    return context.queryClient.ensureQueryData(eventosOptions(from, to));
  },
  component: Agenda,
});

function eventosOptions(from: string, to: string) {
  return queryOptions({
    queryKey: ["eventos", from, to],
    queryFn: () => listEventos({ data: { from, to } }) as Promise<Evento[]>,
  });
}

type Evento = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
};

const TIPOS = ["compromisso", "entrega", "cobranca", "reposicao", "reuniao", "outro"] as const;
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Agenda() {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    tipo: "compromisso",
    data: new Date().toISOString().slice(0, 10),
    hora: "09:00",
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const from = cursor.toISOString();
  const nextMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  const to = nextMonth.toISOString();

  const opts = eventosOptions(from, to);
  const { data: eventos } = useSuspenseQuery(opts);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["eventos"] });

  // Realtime: qualquer mudança na tabela eventos (de qualquer aba/dispositivo)
  // invalida a query e recarrega sozinho, sem precisar de reload manual.
  useEffect(() => {
    const channel = supabase
      .channel("eventos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos" },
        () => invalidate(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useMutation({
    mutationFn: (payload: { titulo: string; tipo: string; status: string; starts_at: string; all_day: boolean }) =>
      createEvento({ data: payload as any }),
    onSuccess: () => {
      toast.success("Evento criado");
      setOpen(false);
      setForm({ ...form, titulo: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteEvento({ data: { id } }),
    onSuccess: () => { toast.success("Removido"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const grid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { day: number | null; date: string | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ day: d, date: dt.toISOString().slice(0, 10) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, date: null });
    return cells;
  }, [cursor]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const e of eventos) {
      const key = e.starts_at.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [eventos]);

  const hojeStr = new Date().toISOString().slice(0, 10);
  const selectedList = selectedDate ? (eventosPorDia.get(selectedDate) ?? []) : (eventosPorDia.get(hojeStr) ?? []);

  function submit() {
    if (!form.titulo.trim()) return toast.error("Título obrigatório");
    const starts = new Date(`${form.data}T${form.hora}:00`).toISOString();
    create.mutate({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      status: "pendente",
      starts_at: starts,
      all_day: false,
    });
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Compromissos em tempo real"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Novo evento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo evento</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Título</Label>
                  <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Data</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Hora</Label>
                    <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title={`${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`}
          className="lg:col-span-2"
          actions={
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Hoje</Button>
              <Button size="icon" variant="ghost" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((c, i) => {
              const evs = c.date ? (eventosPorDia.get(c.date) ?? []) : [];
              const isToday = c.date === hojeStr;
              const isSel = c.date === selectedDate;
              return (
                <button
                  key={i}
                  onClick={() => c.date && setSelectedDate(c.date)}
                  disabled={!c.date}
                  className={`aspect-square rounded-md border p-1.5 text-left text-xs transition ${
                    isSel
                      ? "border-primary bg-primary/10"
                      : isToday
                      ? "border-primary/60 bg-primary/5"
                      : c.day
                      ? "border-border bg-background hover:border-primary/40"
                      : "border-transparent"
                  }`}
                >
                  <div className="tabular">{c.day ?? ""}</div>
                  {evs.length > 0 && (
                    <div className="mt-1 flex gap-0.5">
                      {evs.slice(0, 3).map((e) => (
                        <div key={e.id} className="h-1 w-1 rounded-full bg-primary" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title={selectedDate ? `Eventos · ${selectedDate}` : "Hoje"}>
          <div className="space-y-2">
            {selectedList.length === 0 && <p className="text-xs text-muted-foreground">Sem eventos.</p>}
            {selectedList.map((e) => (
              <div key={e.id} className="group flex items-start gap-3 rounded-md border border-border bg-background p-2.5">
                <div className="tabular w-12 shrink-0 text-xs text-muted-foreground">
                  {new Date(e.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{e.titulo}</div>
                  <div className="text-[11px] text-primary capitalize">{e.tipo}</div>
                </div>
                <button
                  onClick={() => remove.mutate(e.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}
