import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · AG Tech" },
      {
        name: "description",
        content:
          "Como a AG Tech coleta, usa, armazena e elimina dados pessoais, e como exercer seus direitos previstos na LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade · AG Tech" },
      {
        property: "og:description",
        content:
          "Transparência sobre tratamento de dados pessoais na plataforma de gestão da AG Tech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <Link to="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
        ← Voltar
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString("pt-BR")}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Esta página é mantida pela AG Tech para explicar, de forma direta, como a plataforma
        interna de gestão trata dados pessoais. Não constitui certificação nem auditoria
        independente.
      </p>

      <Section title="1. Quem é o controlador">
        <p>
          A AG Tech é a controladora dos dados tratados nesta plataforma. O sistema é de uso
          interno da empresa, para gestão de produtos, clientes, pedidos, financeiro e marketing.
        </p>
      </Section>

      <Section title="2. Quais dados tratamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados de conta dos operadores: nome, e-mail e credenciais de acesso.</li>
          <li>Dados de clientes cadastrados: nome, e-mail, telefone, documento e observações.</li>
          <li>Dados transacionais: pedidos, itens, valores, lançamentos financeiros e agenda.</li>
        </ul>
      </Section>

      <Section title="3. Finalidade e base legal">
        <p>
          Os dados são tratados para execução de contrato e legítimo interesse na gestão comercial:
          emissão e acompanhamento de pedidos, cobrança, atendimento e controle financeiro. Dados
          fiscais e contábeis são retidos por obrigação legal.
        </p>
      </Section>

      <Section title="4. Armazenamento e segurança">
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados armazenados em banco gerenciado, com criptografia em trânsito (HTTPS/TLS).</li>
          <li>
            Isolamento por usuário no banco (row level security): cada conta acessa apenas os
            próprios registros.
          </li>
          <li>Autenticação por sessão persistente, com recuperação de senha por e-mail.</li>
          <li>Limitação de requisições em operações sensíveis para conter uso abusivo.</li>
          <li>Exclusão reversível (soft-delete) para evitar perda acidental de registros.</li>
        </ul>
      </Section>

      <Section title="5. Compartilhamento">
        <p>
          Não vendemos dados pessoais. O compartilhamento se limita a provedores de infraestrutura
          necessários à operação (hospedagem, banco de dados e envio de e-mail transacional).
        </p>
      </Section>

      <Section title="6. Retenção e backup">
        <p>
          Registros ativos são mantidos enquanto houver relação comercial. Registros excluídos ficam
          marcados como excluídos e são removidos definitivamente em rotina de manutenção. Cópias de
          segurança automáticas do banco são mantidas pelo provedor de infraestrutura, com
          retenção diária, e usadas exclusivamente para restauração em caso de incidente.
        </p>
      </Section>

      <Section title="7. Seus direitos (LGPD, art. 18)">
        <p>
          O titular pode solicitar confirmação de tratamento, acesso, correção, portabilidade e
          eliminação dos dados. A plataforma dispõe de mecanismos internos de exportação e de
          anonimização: ao anonimizar, os dados identificáveis são apagados e apenas os valores de
          pedidos e lançamentos já emitidos são preservados, por obrigação fiscal.
        </p>
      </Section>

      <Section title="8. Contato">
        <p>
          Solicitações relacionadas a dados pessoais devem ser encaminhadas ao responsável pela
          AG Tech pelos canais oficiais de atendimento da empresa. Respondemos em até 15 dias.
        </p>
      </Section>
    </main>
  );
}
