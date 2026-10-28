/**
 * Tratamento do "link do produto". Função pura.
 * Só aceita endereços http(s): links como "javascript:..." nunca podem virar um botão clicável.
 */

export type ResultadoLink = { ok: true; url: string | null } | { ok: false; erro: string };

const TEM_ESQUEMA = /^[a-z][a-z0-9+.-]*:/i;

/** Aceita "www.loja.com/x" (acrescenta https://), recusa qualquer outro tipo de endereço. */
export function normalizarLink(texto: string | null | undefined): ResultadoLink {
  const bruto = (texto ?? "").trim();
  if (bruto === "") return { ok: true, url: null };
  if (bruto.length > 2000) return { ok: false, erro: "Link muito longo (máximo de 2000 caracteres)" };
  if (/\s/.test(bruto)) return { ok: false, erro: "O link não pode ter espaços" };

  let candidato = bruto;
  if (candidato.startsWith("//")) candidato = `https:${candidato}`;
  else if (!TEM_ESQUEMA.test(candidato)) candidato = `https://${candidato}`;

  let u: URL;
  try {
    u = new URL(candidato);
  } catch {
    return { ok: false, erro: "Link inválido. Cole o endereço completo da página." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, erro: "Use um link que comece com http:// ou https://" };
  }
  if (!u.hostname.includes(".") && u.hostname !== "localhost") {
    return { ok: false, erro: "Link inválido. Cole o endereço completo da página." };
  }
  if (u.username || u.password) {
    return { ok: false, erro: "O link não pode conter usuário e senha" };
  }
  return { ok: true, url: u.toString() };
}

/** "https://www.loja.com.br/p/123" vira "loja.com.br", para mostrar de onde é o link. */
export function nomeDoSite(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}
