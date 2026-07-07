-- seed.sql — dados ficticios para desenvolvimento
-- Rode DEPOIS do schema.sql: psql -d gestorml -f seed.sql

-- Limpa dados antigos e reinicia os ids (mantem config_taxas)
TRUNCATE vendas, produtos RESTART IDENTITY CASCADE;

-- 4 produtos variados
INSERT INTO produtos (nome, sku, custo, preco_shopee, preco_ml, estoque, estoque_minimo) VALUES
  ('Fone Bluetooth TWS',        'FONE-TWS-01', 25.00,  59.90,  64.90, 40, 5),
  ('Capa de Celular Silicone',  'CAPA-SIL-02',  4.50,  19.90,  22.90, 80, 10),
  ('Carregador Turbo 20W',      'CARR-20W-03', 18.00,  49.90,  54.90, 25, 4),
  ('Suporte de Mesa Notebook',  'SUP-NB-04',   32.00,  89.90,  99.90,  8, 3);

-- 10 vendas espalhadas nos ultimos 30 dias
-- taxa/frete ficticios; lucro sera calculado, nunca salvo
INSERT INTO vendas (data, canal, produto_id, quantidade, valor_recebido, taxa, frete) VALUES
  (CURRENT_DATE - 28, 'shopee',        1, 2, 119.80, 27.96, 8.00),
  (CURRENT_DATE - 25, 'mercado_livre', 3, 1,  54.90,  7.41, 0.00),
  (CURRENT_DATE - 22, 'shopee',        2, 3,  59.70, 15.94, 6.00),
  (CURRENT_DATE - 19, 'mercado_livre', 1, 1,  64.90,  8.76, 0.00),
  (CURRENT_DATE - 16, 'shopee',        4, 1,  89.90, 21.98, 12.00),
  (CURRENT_DATE - 12, 'mercado_livre', 2, 2,  45.80,  6.18, 0.00),
  (CURRENT_DATE -  9, 'shopee',        3, 2,  99.80, 23.96, 8.00),
  (CURRENT_DATE -  6, 'mercado_livre', 4, 1,  99.90, 13.49, 0.00),
  (CURRENT_DATE -  3, 'shopee',        1, 1,  59.90, 15.98, 5.00),
  (CURRENT_DATE -  1, 'mercado_livre', 3, 1,  54.90,  7.41, 0.00);
