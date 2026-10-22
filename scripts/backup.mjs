#!/usr/bin/env node
/**
 * Backup dos seus dados do AG Tech em arquivos JSON.
 *
 * Uso:
 *   BACKUP_EMAIL=seu@email.com BACKUP_PASSWORD=suasenha node scripts/backup.mjs
 *
 * No Windows (PowerShell):
 *   $env:BACKUP_EMAIL="seu@email.com"; $env:BACKUP_PASSWORD="suasenha"; node scripts/backup.mjs
 *
 * Entra com a SUA conta (mesma do site), então só exporta o que você mesmo
 * pode ver, respeitando a segurança por linha (RLS). Não usa chave secreta.
 * Lê SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY do arquivo .env.
 * Salva em backups/AAAA-MM-DD-HHMM/<tabela>.json
 */
import { createClient } from "@supabase/supabase-js";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const TABELAS = [
  "profiles", "products", "categories", "suppliers", "stock_movements",
  "clientes", "pedidos", "pedido_itens", "funis", "funil_etapas",
  "financeiro_lancamentos", "campanhas", "metas", "eventos", "tarefas",
  "automacoes", "bi_snapshots", "calculadora_historico", "access_logs",
];

function lerEnv() {
  if (!existsSync(".env")) return {};
  const out = {};
  for (const linha of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...lerEnv(), ...process.env };
const url = env.SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY;
const email = env.BACKUP_EMAIL;
const password = env.BACKUP_PASSWORD;

if (!url || !key) { console.error("Faltam SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no .env"); process.exit(1); }
if (!email || !password) { console.error("Defina BACKUP_EMAIL e BACKUP_PASSWORD (veja o topo deste arquivo)."); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) { console.error("Falha no login:", authErr.message); process.exit(1); }

const agora = new Date();
const pad = (n) => String(n).padStart(2, "0");
const pasta = `backups/${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}-${pad(agora.getHours())}${pad(agora.getMinutes())}`;
mkdirSync(pasta, { recursive: true });

let total = 0, falhas = 0;
for (const tabela of TABELAS) {
  const linhas = [];
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase.from(tabela).select("*").range(de, de + 999);
    if (error) { console.error(`  FALHOU ${tabela}: ${error.message}`); falhas++; break; }
    linhas.push(...data);
    if (data.length < 1000) break;
  }
  writeFileSync(`${pasta}/${tabela}.json`, JSON.stringify(linhas, null, 2));
  total += linhas.length;
  console.log(`  ${tabela}: ${linhas.length} registro(s)`);
}

console.log(`\nBackup salvo em ${pasta} (${total} registros, ${falhas} tabela(s) com erro).`);
console.log("Guarde uma cópia fora do computador (Google Drive, pen drive).");
process.exit(falhas ? 1 : 0);
