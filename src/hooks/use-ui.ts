import { useEffect, useMemo, useState } from "react";

/** Debounce de valor (padrão 300ms) para buscas e filtros. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Paginação client-side com página resetada quando o total muda. */
export function usePagination<T>(rows: T[], pageSize = 50) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const pageRows = useMemo(
    () => rows.slice((current - 1) * pageSize, current * pageSize),
    [rows, current, pageSize],
  );

  return {
    page: current,
    setPage,
    totalPages,
    pageRows,
    total: rows.length,
    from: rows.length === 0 ? 0 : (current - 1) * pageSize + 1,
    to: Math.min(current * pageSize, rows.length),
  };
}

/** Respeita prefers-reduced-motion para desligar animações. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
