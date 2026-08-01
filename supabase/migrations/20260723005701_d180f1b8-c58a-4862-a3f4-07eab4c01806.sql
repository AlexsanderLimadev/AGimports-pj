
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.financeiro_lancamentos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.campanhas ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.funis ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.automacoes ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_products_user_active ON public.products(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_user_active ON public.clientes(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_user_active ON public.pedidos(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financeiro_user_active ON public.financeiro_lancamentos(user_id, data DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_campanhas_user_active ON public.campanhas(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_metas_user_active ON public.metas(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tarefas_user_active ON public.tarefas(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_eventos_user_active ON public.eventos(user_id, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_funis_user_active ON public.funis(user_id, created_at DESC) WHERE deleted_at IS NULL;
