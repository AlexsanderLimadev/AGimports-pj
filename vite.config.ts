import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Configuração própria, sem o wrapper @lovable.dev/vite-tanstack-config.
//
// Preset do Nitro: "vercel" quando o build roda na Vercel (ela define a variável
// VERCEL), e "node-server" em qualquer outro lugar, inclusive no seu computador.
// Pra trocar de hospedagem depois, é só mudar aqui:
//   - Cloudflare    -> preset: "cloudflare-module"
//   - Node genérico -> preset: "node-server"
// https://nitro.build/deploy
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: process.env.VERCEL ? "vercel" : "node-server" }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});
