/** Mensagem vermelha pequena embaixo de um campo. Não ocupa espaço quando não há erro. */
export function ErroCampo({ mensagem }: { mensagem?: string | null }) {
  if (!mensagem) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {mensagem}
    </p>
  );
}

/** Classe extra para deixar a borda do campo vermelha quando há erro. */
export function bordaErro(mensagem?: string | null): string {
  return mensagem ? "border-destructive focus-visible:ring-destructive" : "";
}
