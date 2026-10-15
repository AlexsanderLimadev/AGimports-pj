import { useCallback, useRef, type PointerEvent } from "react";

const FALLOFF_CURVES: Record<string, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

/**
 * Efeito de "proximidade do cursor" — adaptado do componente LineSidebar
 * (React Bits) pro menu lateral do AG Tech, que tem ícone + grupos +
 * modo colapsado (o componente original assume uma lista simples, sem
 * essas partes, então não dava pra só "colar" ele aqui).
 *
 * Cada item registrado recebe uma CSS var --effect (0 a 1) que sobe suave
 * conforme o mouse se aproxima verticalmente dele, e desce suave quando o
 * mouse se afasta ou sai do menu. Um único loop de animação (rAF) cuida de
 * todos os itens juntos, com suavização exponencial independente de FPS —
 * mesma técnica do componente original, só que usando a posição real na
 * tela (getBoundingClientRect) em vez de offsetTop, porque aqui os itens
 * vivem em grupos/listas separadas, não numa lista única.
 */
export function useProximityEffect({
  radius = 90,
  falloff = "smooth",
  smoothingMs = 100,
}: {
  radius?: number;
  falloff?: keyof typeof FALLOFF_CURVES;
  smoothingMs?: number;
} = {}) {
  const itemsRef = useRef(new Map<string, HTMLElement>());
  const targetRef = useRef(new Map<string, number>());
  const currentRef = useRef(new Map<string, number>());
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingMs, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    itemsRef.current.forEach((el, key) => {
      const target = targetRef.current.get(key) ?? 0;
      const cur = currentRef.current.get(key) ?? 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current.set(key, value);
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    });

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, [smoothingMs]);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  // Ref-callback: coloca no elemento de cada item, passando uma chave única
  const registerItem = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) itemsRef.current.set(key, el);
      else itemsRef.current.delete(key);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.smooth;
      const pointerY = e.clientY;
      itemsRef.current.forEach((el, key) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(pointerY - center);
        targetRef.current.set(key, ease(Math.max(0, 1 - distance / radius)));
      });
      startLoop();
    },
    [falloff, radius, startLoop],
  );

  const onPointerLeave = useCallback(() => {
    itemsRef.current.forEach((_el, key) => targetRef.current.set(key, 0));
    startLoop();
  }, [startLoop]);

  return { registerItem, onPointerMove, onPointerLeave };
}
