-- Link do produto (página do fornecedor, anúncio, catálogo...) para abrir direto da lista.
-- Segura para rodar mais de uma vez.
alter table public.products
  add column if not exists link_url text
  check (link_url is null or char_length(link_url) <= 2000);

notify pgrst, 'reload schema';
