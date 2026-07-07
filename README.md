# GestorML — Gestão de Vendas para Shopee e Mercado Livre

Sistema web simples para um **vendedor iniciante** controlar produtos, registrar
vendas, calcular o preço certo e acompanhar o lucro do dia a dia nos marketplaces
**Shopee** e **Mercado Livre**.

## Contexto acadêmico

Projeto desenvolvido para a **Atividade Extensionista II** do curso de
Tecnologia da **UNINTER**. A proposta é aplicar conhecimento técnico para
resolver um problema real de um pequeno empreendedor da comunidade, alinhado aos
**Objetivos de Desenvolvimento Sustentável (ODS)** da ONU:

- **ODS 08 — Trabalho decente e crescimento econômico:** ajuda o vendedor a
  entender o próprio lucro e tomar decisões que sustentem o negócio.
- **ODS 09 — Indústria, inovação e infraestrutura:** leva uma ferramenta digital
  a um microempreendedor que hoje controla tudo no papel ou na memória.
- **ODS 10 — Redução das desigualdades:** dá acesso a tecnologia de gestão que
  normalmente só grandes lojas possuem.

## Prints das telas

> _(Substituir pelos prints reais depois de rodar o sistema.)_

| Tela | Print |
|------|-------|
| Dashboard (indicadores e gráficos) | `docs/print-dashboard.png` |
| Produtos (cadastro e estoque) | `docs/print-produtos.png` |
| Calculadora de preço | `docs/print-calculadora.png` |
| Registrar venda | `docs/print-registrar-venda.png` |
| Histórico de vendas | `docs/print-historico.png` |

## Tecnologias (stack)

| Camada | Tecnologia |
|--------|------------|
| Back-end | Node.js + Express |
| Banco de dados | PostgreSQL (pacote `pg`) |
| Front-end | React + Vite (JavaScript) |
| Gráficos | Recharts |
| Estilo | CSS único, sem framework |

Sem login, sem Docker, sem integração com API dos marketplaces: o estoque é dado
baixa automaticamente quando o vendedor registra a venda no sistema.

---

## Instalação do zero (passo a passo)

Feito para quem **nunca** viu o projeto. Siga na ordem.

### 1. Pré-requisitos

Instale, se ainda não tiver:

- **Node.js** versão 18 ou superior — https://nodejs.org (baixe a versão "LTS").
- **PostgreSQL** versão 14 ou superior — https://www.postgresql.org/download/
  Durante a instalação, **anote o usuário e a senha** que você definir
  (normalmente o usuário é `postgres`).

Confira no terminal se instalou:

```bash
node -v
npm -v
psql --version
```

### 2. Baixar o projeto

```bash
git clone https://github.com/klucas27/gestor-ml.git
cd gestor-ml
```

### 3. Criar o banco de dados

Crie um banco chamado `gestorml` e carregue a estrutura e os dados de exemplo:

```bash
createdb gestorml
psql -d gestorml -f backend/schema.sql
psql -d gestorml -f backend/seed.sql
```

> Se o `createdb` pedir usuário/senha, use os que você definiu ao instalar o
> PostgreSQL. Em alguns sistemas é preciso rodar como o usuário do banco, por
> exemplo: `sudo -u postgres createdb gestorml`.

O arquivo `seed.sql` é **opcional** — ele apenas coloca 4 produtos e 10 vendas de
exemplo para você ver o sistema funcionando. Na hora da entrega ao vendedor, pule
o `seed.sql` para começar com o banco vazio.

### 4. Configurar e iniciar o back-end

```bash
cd backend
npm install
cp .env.exemplo .env
```

Abra o arquivo `.env` e ajuste a linha com o **usuário e a senha do seu
PostgreSQL**:

```
DATABASE_URL=postgres://usuario:senha@localhost:5432/gestorml
```

Inicie o servidor:

```bash
npm start
```

Deve aparecer: `GestorML backend rodando em http://localhost:3001`.
**Deixe esse terminal aberto.**

### 5. Iniciar o front-end (modo desenvolvimento)

Abra **outro terminal**:

```bash
cd gestor-ml/frontend
npm install
npm run dev
```

Abra no navegador o endereço que aparecer (normalmente
**http://localhost:5173**). Pronto: o sistema está no ar.

---

## Rodar em produção local (tudo em um só endereço)

Para o computador do vendedor não é prático manter dois terminais. Nesse caso,
**compile** o front e deixe o Express servir tudo na porta **3001**.

### 1. Gerar o front-end compilado

```bash
cd frontend
npm run build
```

Isso cria a pasta `frontend/dist`.

### 2. Iniciar apenas o back-end

O `server.js` já está configurado para servir os arquivos compilados:

```js
app.use(express.static(path.join(__dirname, '../frontend/dist')));
```

Então basta:

```bash
cd ../backend
npm start
```

Agora **todo o sistema** fica em um único endereço:
**http://localhost:3001**. Esse é o link que o vendedor vai usar.

---

## Como usar no dia a dia (para o vendedor)

Guia simples, sem termos técnicos. O fluxo de um dia normal:

1. **Abra o sistema** no atalho do navegador (ícone na área de trabalho). Vai
   cair direto no **Painel** (Dashboard), com o resumo do mês.
2. **Cadastre seus produtos** (só na primeira vez, ou quando tiver item novo).
   Vá em **Produtos → Novo produto**, preencha o nome, o custo (quanto você pagou)
   e o estoque. O "SKU" é opcional — é só um código seu, se você usar.
3. **Descubra o preço de venda** na tela **Calculadora**. Informe o custo, o
   frete e a margem de lucro que você quer. O sistema mostra o **preço mínimo**
   (sem lucro) e o **preço sugerido** (já com seu lucro), descontando a taxa do
   marketplace.
4. **Registre cada venda** assim que vender, em **Registrar Venda**. Escolha o
   canal (Shopee ou Mercado Livre), o produto e o valor recebido. O estoque baixa
   sozinho — você não precisa fazer conta.
5. **Acompanhe o resultado** no **Painel**: faturamento, lucro, número de vendas
   e os produtos que mais saem. Troque o período (Este mês, Últimos 30 dias,
   Tudo) para comparar.

> Regra de ouro: **registre toda venda no mesmo dia**. Assim o estoque e o lucro
> ficam sempre certos.

---

## Checklist de implantação no computador do vendedor

- [ ] Instalar o **PostgreSQL** e anotar usuário/senha.
- [ ] Instalar o **Node.js** (versão LTS).
- [ ] Baixar o projeto e **restaurar o schema**: `psql -d gestorml -f backend/schema.sql`
      (sem o `seed.sql`, para começar do zero).
- [ ] Criar o arquivo `backend/.env` com a senha correta do banco.
- [ ] Rodar `npm install` no **backend** e no **frontend**.
- [ ] Gerar o build do front: `cd frontend && npm run build`.
- [ ] Iniciar o sistema: `cd backend && npm start`.
- [ ] Criar um **atalho do navegador** na área de trabalho apontando para
      **http://localhost:3001** (nome do atalho: "GestorML").
- [ ] **Cadastrar 1 ou 2 produtos reais** junto com o vendedor.
- [ ] **Registrar 1 venda real** com ele e conferir se o estoque baixou e o
      lucro apareceu no Painel.
- [ ] Ensinar o fluxo de 5 passos da seção "Como usar no dia a dia".

---

## Melhorias futuras (para as considerações finais do relatório)

1. **Backup automático dos dados:** exportação periódica do banco (ou botão
   "Exportar para Excel/CSV") para o vendedor não perder o histórico se o
   computador falhar.
2. **Acesso pelo celular:** hospedar o sistema na nuvem com login simples, para o
   vendedor registrar vendas direto do telefone, de qualquer lugar.
3. **Alertas e integração com os marketplaces:** avisos automáticos de estoque
   baixo (por WhatsApp/e-mail) e importação das vendas direto da API da Shopee e
   do Mercado Livre, eliminando o registro manual.

---

Projeto desenvolvido por **Kresley Lucas** — Atividade Extensionista II, UNINTER.
