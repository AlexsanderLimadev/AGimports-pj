
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.pedido_status AS ENUM ('novo','separacao','expedicao','entregue','cancelado');
CREATE TYPE public.pedido_canal AS ENUM ('site','whatsapp','marketplace','loja','outro');
CREATE TYPE public.evento_tipo AS ENUM ('compromisso','entrega','cobranca','reposicao','reuniao','outro');
CREATE TYPE public.evento_status AS ENUM ('pendente','concluido','cancelado');
CREATE TYPE public.fin_tipo AS ENUM ('receita','despesa');
CREATE TYPE public.fin_status AS ENUM ('pendente','pago','atrasado','cancelado');
CREATE TYPE public.campanha_status AS ENUM ('rascunho','ativa','pausada','finalizada');
CREATE TYPE public.meta_tipo AS ENUM ('faturamento','pedidos','clientes','lucro','ticket_medio');
CREATE TYPE public.meta_periodo AS ENUM ('mes','trimestre','ano');
CREATE TYPE public.tarefa_status AS ENUM ('todo','doing','done');
CREATE TYPE public.tarefa_prioridade AS ENUM ('baixa','media','alta');

-- =========================================================================
-- CLIENTES
-- =========================================================================
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text,
  telefone text,
  documento text,
  tags text[] NOT NULL DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_clientes ON public.clientes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_clientes_user ON public.clientes(user_id);

-- =========================================================================
-- PEDIDOS
-- =========================================================================
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome_snapshot text,
  status public.pedido_status NOT NULL DEFAULT 'novo',
  canal public.pedido_canal NOT NULL DEFAULT 'site',
  total_cents integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_pedidos ON public.pedidos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_pedidos_user_created ON public.pedidos(user_id, created_at DESC);
CREATE INDEX idx_pedidos_cliente ON public.pedidos(cliente_id);

-- Auto-numeração de pedidos por usuário
CREATE OR REPLACE FUNCTION public.tg_pedidos_autonumber()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = 0 THEN
    SELECT COALESCE(MAX(numero),0)+1 INTO NEW.numero FROM public.pedidos WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_pedidos_autonumber BEFORE INSERT ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.tg_pedidos_autonumber();

-- =========================================================================
-- PEDIDO_ITENS
-- =========================================================================
CREATE TABLE public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  descricao_snapshot text NOT NULL,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0),
  unit_price_cents integer NOT NULL DEFAULT 0,
  subtotal_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_pedido_itens ON public.pedido_itens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_pedido_itens_pedido ON public.pedido_itens(pedido_id);

-- =========================================================================
-- EVENTOS (Agenda)
-- =========================================================================
CREATE TABLE public.eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tipo public.evento_tipo NOT NULL DEFAULT 'compromisso',
  status public.evento_status NOT NULL DEFAULT 'pendente',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  all_day boolean NOT NULL DEFAULT false,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT ALL ON public.eventos TO service_role;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_eventos ON public.eventos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_eventos_user_start ON public.eventos(user_id, starts_at);

-- =========================================================================
-- FINANCEIRO
-- =========================================================================
CREATE TABLE public.financeiro_lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.fin_tipo NOT NULL,
  categoria text,
  descricao text NOT NULL,
  valor_cents integer NOT NULL,
  data date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  status public.fin_status NOT NULL DEFAULT 'pendente',
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financeiro_lancamentos TO authenticated;
GRANT ALL ON public.financeiro_lancamentos TO service_role;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_fin ON public.financeiro_lancamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_fin_updated_at BEFORE UPDATE ON public.financeiro_lancamentos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_fin_user_data ON public.financeiro_lancamentos(user_id, data DESC);

-- =========================================================================
-- CAMPANHAS
-- =========================================================================
CREATE TABLE public.campanhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  canal text NOT NULL DEFAULT 'meta',
  status public.campanha_status NOT NULL DEFAULT 'rascunho',
  budget_cents integer NOT NULL DEFAULT 0,
  gasto_cents integer NOT NULL DEFAULT 0,
  receita_cents integer NOT NULL DEFAULT 0,
  starts_at date,
  ends_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campanhas TO authenticated;
GRANT ALL ON public.campanhas TO service_role;
ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_campanhas ON public.campanhas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_campanhas_updated_at BEFORE UPDATE ON public.campanhas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_campanhas_user ON public.campanhas(user_id);

-- =========================================================================
-- FUNIS
-- =========================================================================
CREATE TABLE public.funis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funis TO authenticated;
GRANT ALL ON public.funis TO service_role;
ALTER TABLE public.funis ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_funis ON public.funis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_funis_updated_at BEFORE UPDATE ON public.funis FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_funis_user ON public.funis(user_id);

CREATE TABLE public.funil_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funil_id uuid NOT NULL REFERENCES public.funis(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  nome text NOT NULL,
  pessoas integer NOT NULL DEFAULT 0,
  conv numeric(6,2) NOT NULL DEFAULT 0,
  valor_cents integer NOT NULL DEFAULT 0,
  cor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funil_etapas TO authenticated;
GRANT ALL ON public.funil_etapas TO service_role;
ALTER TABLE public.funil_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_funil_etapas ON public.funil_etapas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_funil_etapas_updated_at BEFORE UPDATE ON public.funil_etapas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_funil_etapas_funil ON public.funil_etapas(funil_id, ordem);

-- =========================================================================
-- METAS
-- =========================================================================
CREATE TABLE public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo public.meta_tipo NOT NULL,
  periodo public.meta_periodo NOT NULL DEFAULT 'mes',
  alvo numeric(14,2) NOT NULL,
  atual numeric(14,2) NOT NULL DEFAULT 0,
  starts_at date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  ends_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas TO authenticated;
GRANT ALL ON public.metas TO service_role;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_metas ON public.metas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_metas_updated_at BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_metas_user ON public.metas(user_id);

-- =========================================================================
-- TAREFAS
-- =========================================================================
CREATE TABLE public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  status public.tarefa_status NOT NULL DEFAULT 'todo',
  prioridade public.tarefa_prioridade NOT NULL DEFAULT 'media',
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_tarefas ON public.tarefas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_tarefas_user ON public.tarefas(user_id, status);

-- =========================================================================
-- AUTOMACOES
-- =========================================================================
CREATE TABLE public.automacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  gatilho text NOT NULL,
  acao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automacoes TO authenticated;
GRANT ALL ON public.automacoes TO service_role;
ALTER TABLE public.automacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_automacoes ON public.automacoes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_automacoes_updated_at BEFORE UPDATE ON public.automacoes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- CALCULADORA HISTORICO
-- =========================================================================
CREATE TABLE public.calculadora_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  custo_cents integer NOT NULL DEFAULT 0,
  frete_cents integer NOT NULL DEFAULT 0,
  impostos_pct numeric(6,2) NOT NULL DEFAULT 0,
  margem_pct numeric(6,2) NOT NULL DEFAULT 0,
  preco_final_cents integer NOT NULL DEFAULT 0,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calculadora_historico TO authenticated;
GRANT ALL ON public.calculadora_historico TO service_role;
ALTER TABLE public.calculadora_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_calc ON public.calculadora_historico FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_calc_user ON public.calculadora_historico(user_id, created_at DESC);

-- =========================================================================
-- REALTIME
-- =========================================================================
ALTER TABLE public.eventos REPLICA IDENTITY FULL;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER TABLE public.tarefas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tarefas;
