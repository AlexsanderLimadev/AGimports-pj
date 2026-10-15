import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · AG Tech" },
      {
        name: "description",
        content: "Regras de uso da plataforma de gestão AG Tech.",
      },
      { property: "og:title", content: "Termos de Uso · AG Tech" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Termos,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Termos() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <Link to="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
        ← Voltar
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">Termos de Uso</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Estes termos regem o uso da plataforma AG Tech. Ao criar uma conta ou acessar o
        sistema, você concorda com o descrito abaixo.
      </p>

      <Section title="1. O que é a plataforma">
        <p>
          A AG Tech é um sistema de gestão (ERP) para operações de venda, estoque, financeiro,
          marketing e relacionamento com clientes, de uso interno da empresa e destinado a
          usuários autorizados por ela.
        </p>
      </Section>

      <Section title="2. Conta e acesso">
        <p>
          Cada conta é pessoal e intransferível. Você é responsável por manter sua senha em
          sigilo e por toda atividade realizada com suas credenciais. Avise imediatamente se
          suspeitar de acesso não autorizado.
        </p>
      </Section>

      <Section title="3. Uso permitido">
        <p>
          A plataforma deve ser usada apenas para fins legítimos de gestão do negócio. É proibido
          tentar acessar dados de outros usuários sem autorização, sobrecarregar o sistema de
          propósito, ou usar a plataforma para fins ilegais.
        </p>
      </Section>

      <Section title="4. Dados inseridos por você">
        <p>
          Os dados de produtos, clientes, pedidos e financeiro que você cadastra continuam sendo
          seus. A plataforma os armazena e processa para viabilizar as funcionalidades do sistema,
          conforme detalhado na{" "}
          <Link to="/privacidade" className="underline hover:text-foreground">
            Política de Privacidade
          </Link>
          .
        </p>
      </Section>

      <Section title="5. Disponibilidade">
        <p>
          Buscamos manter o sistema disponível e funcionando corretamente, mas não garantimos
          operação ininterrupta. Manutenções, atualizações ou instabilidades podem ocasionar
          indisponibilidade temporária.
        </p>
      </Section>

      <Section title="6. Limitação de responsabilidade">
        <p>
          A plataforma é fornecida como ferramenta de apoio à gestão. Decisões de negócio tomadas
          com base nos dados e relatórios do sistema são de responsabilidade de quem as toma. A
          AG Tech não se responsabiliza por perdas decorrentes de uso inadequado, erro de
          digitação de dados, ou decisões comerciais.
        </p>
      </Section>

      <Section title="7. Encerramento de conta">
        <p>
          Você pode solicitar o encerramento da sua conta e a eliminação dos seus dados pessoais a
          qualquer momento, conforme os mecanismos descritos na Política de Privacidade.
        </p>
      </Section>

      <Section title="8. Alterações destes termos">
        <p>
          Estes termos podem ser atualizados conforme a plataforma evolui. Mudanças relevantes
          serão comunicadas dentro do próprio sistema.
        </p>
      </Section>

      <Section title="9. Contato">
        <p>
          Dúvidas sobre estes termos podem ser encaminhadas pelos canais oficiais de atendimento
          da AG Tech.
        </p>
      </Section>
    </main>
  );
}
