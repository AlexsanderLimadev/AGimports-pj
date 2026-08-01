import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Configuração própria, sem o wrapper @lovable.dev/vite-tanstack-config.
//
// Preset "node-server": roda em qualquer lugar com Node.js. Pra trocar de
// hospedagem depois, é só mudar essa string:
//   - Vercel        -> preset: "vercel"
//   - Cloudflare    -> preset: "cloudflare-module"
//   - Node genérico -> preset: "node-server" (atual)
// https://nitro.build/deploy
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: "node-server" }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});
