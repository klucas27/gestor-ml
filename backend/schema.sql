-- schema.sql — estrutura do banco GestorML
-- Rode com: psql -d gestorml -f schema.sql

-- Apaga tabelas antigas para permitir recriar do zero sem erro
DROP TABLE IF EXISTS vendas;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS config_taxas;

-- Produtos cadastrados pelo vendedor
CREATE TABLE produtos (
  id serial PRIMARY KEY,
  nome text NOT NULL,
  sku text,
  custo numeric(10,2) NOT NULL,
  preco_shopee numeric(10,2),
  preco_ml numeric(10,2),
  estoque int DEFAULT 0,
  estoque_minimo int DEFAULT 3
);

-- Vendas registradas (lucro NUNCA fica salvo aqui, sempre calculado)
CREATE TABLE vendas (
  id serial PRIMARY KEY,
  data date DEFAULT CURRENT_DATE,
  canal text CHECK (canal IN ('shopee','mercado_livre')),
  produto_id int REFERENCES produtos(id),
  quantidade int NOT NULL,
  valor_recebido numeric(10,2) NOT NULL,
  taxa numeric(10,2) DEFAULT 0,
  frete numeric(10,2) DEFAULT 0
);

-- Configuracao de taxas por canal
CREATE TABLE config_taxas (
  id serial PRIMARY KEY,
  canal text UNIQUE,
  percentual numeric(5,2),
  taxa_fixa numeric(10,2) DEFAULT 0
);

-- Taxas iniciais dos dois canais
INSERT INTO config_taxas (canal, percentual, taxa_fixa) VALUES
  ('shopee', 20.00, 4.00),
  ('mercado_livre', 13.50, 0.00);
