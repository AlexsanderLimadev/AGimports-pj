import { useCallback, useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import logoIcon from "@/assets/ag-imports-logo.png";
import logoFull from "@/assets/ag-imports-logo-full.png";

/** Posição relativa do mouse (0..1) dentro de um elemento. */
export function useMouseRel(ref: RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const cb = useCallback(
    (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
    },
    [ref],
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", cb);
    return () => el.removeEventListener("mousemove", cb);
  }, [cb, ref]);
  return pos;
}

/** Textura de grão bem sutil — dá profundidade sem precisar de imagem. */
export function Grain({ opacity = 0.022 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px",
      }}
    />
  );
}

/** Grade fina de fundo — profundidade sutil, sem cor. */
export function Grid() {
  const id = useId().replace(/:/g, "");
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.03 }}>
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M 64 0 L 0 0 0 64" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </svg>
    </div>
  );
}

/** Card que "acende" sutilmente onde o cursor passa por cima. */
export function SpotCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [p, setP] = useState({ x: 0.5, y: 0.5 });
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setP({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={`relative overflow-hidden rounded-xl border transition-all duration-300 cursor-default ${className}`}
      style={{
        background: on
          ? `radial-gradient(220px circle at ${p.x * 100}% ${p.y * 100}%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)`
          : "rgba(255,255,255,0.02)",
        borderColor: on ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.07)",
      }}
    >
      {on && (
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(140px circle at ${p.x * 100}% ${p.y * 100}%, rgba(255,255,255,0.055) 0%, transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Logo real da AG Imports (monograma, enviado pelo usuário) — sempre
 * dentro de um chip branco arredondado, pra garantir contraste tanto nas
 * páginas sempre-escuras (login/landing) quanto nos dois temas do app
 * (a arte é preta, então sumiria num fundo escuro sem essa base).
 */
export function AGLogo({ size = 48, rounded = "rounded-lg" }: { size?: number; rounded?: string }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-white ${rounded}`}
      style={{ width: size, height: size, padding: size * 0.14 }}
    >
      <img src={logoIcon} alt="AG Imports" className="h-full w-full object-contain" />
    </div>
  );
}

/** Versão completa (monograma + "IMPORTS"), pro cabeçalho do login/landing. */
export function AGLogoFull({ height = 64 }: { height?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-2xl bg-white"
      style={{ height, padding: height * 0.16 }}
    >
      <img src={logoFull} alt="AG Imports" className="h-full w-auto object-contain" />
    </div>
  );
}

/** Marca (logo + nome), com versão compacta pro menu colapsado. */
export function Brand({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <AGLogo size={30} />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <AGLogo size={34} />
      <div className="flex flex-col leading-none">
        <span
          className="font-semibold text-white/88"
          style={{ fontSize: 13, letterSpacing: "-0.025em", fontFamily: "Inter, sans-serif" }}
        >
          AG Imports
        </span>
        <span
          className="text-white/28"
          style={{ fontSize: 9, letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}
        >
          ERP · Business Suite
        </span>
      </div>
    </div>
  );
}
