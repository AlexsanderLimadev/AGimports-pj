/**
 * Verificação em duas etapas (aplicativo autenticador). Funções puras, sem rede.
 * "aal1" = entrou só com senha; "aal2" = entrou com senha + código do aplicativo.
 */

export type NivelAssurance = {
  currentLevel: string | null;
  nextLevel: string | null;
} | null;

export type FatorMfa = {
  id: string;
  factor_type?: string | null;
  status?: string | null;
  friendly_name?: string | null;
};

/** A pessoa tem o segundo passo ativo mas ainda não digitou o código nesta sessão. */
export function exigeSegundaEtapa(aal: NivelAssurance | undefined): boolean {
  if (!aal) return false;
  return aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";
}

/** Só dígitos, no máximo 6. Aceita colar "123 456" ou "123-456". */
export function limparCodigo(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, 6);
}

export function codigoValido(texto: string): boolean {
  return /^\d{6}$/.test(texto);
}

export function fatoresTotpVerificados<T extends FatorMfa>(fatores: T[] | null | undefined): T[] {
  return (fatores ?? []).filter((f) => f.factor_type === "totp" && f.status === "verified");
}

export function fatoresTotpPendentes<T extends FatorMfa>(fatores: T[] | null | undefined): T[] {
  return (fatores ?? []).filter((f) => f.factor_type === "totp" && f.status !== "verified");
}

/** Mensagens do Supabase Auth sobre MFA, em português e com o que fazer. */
export function traduzirErroMfa(mensagem: string): string {
  const m = (mensagem ?? "").toLowerCase();
  // Sessão vencida primeiro: "JWT expired" não pode virar "código incorreto".
  if (/jwt|unauthorized|not authenticated|session/.test(m)) {
    return "Sua sessão acabou. Entre de novo para continuar.";
  }
  if (/invalid.*(totp|code)|code.*(invalid|expired)|totp.*expired|incorrect/.test(m)) {
    return "Código incorreto ou vencido. Confira o código atual do aplicativo e tente de novo.";
  }
  if (/rate limit|too many|over_request_rate/.test(m)) {
    return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
  }
  if (/enroll.*(disabled|not enabled)|mfa.*(disabled|not enabled)|verify.*disabled/.test(m)) {
    return "A verificação em duas etapas está desligada no Supabase. Ative em Authentication, na parte de Multi-Factor, e tente de novo.";
  }
  if (/aal2|assurance/.test(m)) {
    return "Para fazer isso, confirme antes com o código atual do aplicativo.";
  }
  if (/factor.*(not found|does not exist)/.test(m)) {
    return "Essa verificação não existe mais. Atualize a página.";
  }
  return "Não foi possível concluir a verificação em duas etapas. Tente de novo.";
}
