/** Exportação CSV no cliente (sem dependências). */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // Neutraliza injeção de fórmula em Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function toCsv<T>(
  rows: T[],
  columns: { header: string; value: (row: T) => unknown }[],
): string {
  const head = columns.map((c) => escapeCell(c.header)).join(";");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(";"));
  // BOM para o Excel reconhecer UTF-8; ";" como separador padrão pt-BR.
  return "\uFEFF" + [head, ...body].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const csvDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR") : "";

export const csvMoney = (cents: number | null | undefined) =>
  ((cents ?? 0) / 100).toFixed(2).replace(".", ",");
