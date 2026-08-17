# Deploy no alwaysdata (plano free) — manual

Guia para publicar o GestorML no [alwaysdata](https://www.alwaysdata.com).
O deploy é **manual**: você roda um script na sua máquina e envia os arquivos
prontos para o servidor quando quiser. Não há automação em `git push`.

## Como funciona

O plano free do alwaysdata tem **256MB de RAM**. Isso é suficiente para rodar
o Express (`node server.js` usa ~60-80MB), mas **não** é suficiente para rodar
`npm install` ou `vite build` no servidor — esses processos estouram a memória
e são mortos. Por isso:

- **Sua máquina** faz todo o trabalho pesado: compila o front e instala as
  dependências (script `build-deploy.sh`).
- **O servidor** só recebe arquivos prontos e executa `node server.js`, que
  serve a API em `/api` e o front estático da pasta `public/`.
- Docker fica **só no desenvolvimento** (banco local). Em produção o banco é
  o PostgreSQL do próprio alwaysdata.

---

## Passo 1 — Conta e site no alwaysdata

1. Crie a conta free em <https://www.alwaysdata.com>. Anote o **nome da conta**
   (ex.: `minhaconta`) — ele aparece em tudo: `minhaconta.alwaysdata.net`.
2. No painel, vá em **Web → Sites** e edite o site padrão (ou crie um novo):
   - **Type:** `Node.js`
   - **Command:** `node ~/www/gestor-ml/server.js`
   - **Working directory:** `www/gestor-ml`
   - **Node.js version:** 22 (ou a mais recente disponível)
   - Não precisa configurar porta: o alwaysdata injeta a variável `PORT` e o
     `server.js` já a usa.

## Passo 2 — Banco PostgreSQL

1. No painel, **Databases → PostgreSQL → Add a database**. Crie o banco
   (ex.: `minhaconta_gestorml`) e um usuário com senha.
2. O host do banco é `postgresql-minhaconta.alwaysdata.net`.
3. Carregue o `schema.sql` (cria as 3 tabelas e as taxas iniciais). Da sua
   máquina:
   ```bash
   psql -h postgresql-minhaconta.alwaysdata.net -U usuario -d minhaconta_gestorml -f backend/schema.sql
   ```
   Sem `psql` instalado, use o **phpPgAdmin** do painel e cole o conteúdo do
   arquivo.

   > Não carregue o `seed.sql` — ele tem vendas fictícias, só para
   > desenvolvimento. Em produção o vendedor começa com o banco vazio.

## Passo 3 — Gerar o pacote na sua máquina

```bash
cd gestor-ml
./build-deploy.sh
```

O script compila o front, copia para dentro do back-end e monta a pasta
`deploy/` — **API + front estático no mesmo lugar** —, além do arquivo
`gestor-ml-deploy.tar.gz` para upload:

```
deploy/
  server.js  auth.js  db.js  package.json  package-lock.json
  routes/        (login, produtos, vendas, dashboard, taxas)
  public/        (front compilado — o Express serve daqui)
  node_modules/  (dependências de produção, prontas)
  schema.sql  seed.sql  .env.exemplo
```

Teste antes de subir — é exatamente o que roda no servidor:

```bash
cd deploy && node server.js     # http://localhost:3001
```

## Passo 4 — Enviar os arquivos

### Opção A — SSH + rsync (recomendada, e a mais rápida nas próximas vezes)

1. No painel, **Remote access → SSH**: habilite o usuário SSH e defina a senha.
2. Crie o arquivo `alwaysdata.conf` na raiz do projeto (ele está no
   `.gitignore`, não vai para o GitHub):
   ```bash
   CONTA=minhaconta
   SSH_HOST=ssh-minhaconta.alwaysdata.net
   SSH_USER=minhaconta
   PASTA_REMOTA=www/gestor-ml
   API_KEY=          # opcional — reinicia o site sozinho
   SITE_ID=          # opcional
   ```
3. Envie:
   ```bash
   ./enviar-alwaysdata.sh              # compila e envia
   ./enviar-alwaysdata.sh --so-enviar  # envia a pasta deploy/ já pronta
   ```

O envio apaga do servidor os arquivos antigos, mas **preserva o `.env`** que
está lá.

Para não digitar a senha do SSH toda vez:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/alwaysdata -N ""
ssh-copy-id -i ~/.ssh/alwaysdata.pub minhaconta@ssh-minhaconta.alwaysdata.net
```

### Opção B — FTP / gerenciador de arquivos do painel (sem terminal)

1. No painel, **Remote access → FTP**: crie/anote o usuário e a senha.
2. Conecte com o FileZilla (ou use **Files** no painel) e envie **o conteúdo
   da pasta `deploy/`** para `www/gestor-ml/` no servidor — inclusive a pasta
   `node_modules`.
3. São muitos arquivos pequenos; se o FTP ficar lento, use a Opção A.

## Passo 5 — Criar o `.env` no servidor

O `.env` **nunca** sai da sua máquina nem entra no git: ele é criado
direto no servidor, uma única vez.

Por SSH:

```bash
ssh minhaconta@ssh-minhaconta.alwaysdata.net
cat > ~/www/gestor-ml/.env <<'EOF'
DATABASE_URL=postgres://usuario:senha@postgresql-minhaconta.alwaysdata.net:5432/minhaconta_gestorml
USUARIO_ACESSO=vendedor
SENHA_ACESSO=uma-senha-boa-aqui
SEGREDO_TOKEN=cole-aqui-um-valor-aleatorio-longo
EOF
```

Sem SSH: crie um arquivo `.env` na sua máquina com esse conteúdo e envie por
FTP para a pasta `www/gestor-ml/`.

- `USUARIO_ACESSO` e `SENHA_ACESSO` são o login da tela de entrada do sistema.
- `SEGREDO_TOKEN` assina o token de sessão. Gere um valor aleatório com:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Trocar esse valor desconecta quem estiver logado (útil se a senha vazar).

> Sem essas variáveis o sistema sobe com o login padrão `vendedor` /
> `gestor123`. **Não deixe assim em produção.**

## Passo 6 — Ligar o site

No painel, **Web → Sites → Restart**. Abra
`https://minhaconta.alwaysdata.net` — deve aparecer a tela de login.

O HTTPS já vem por padrão no alwaysdata; é ele que protege a senha em trânsito.

---

## Publicar uma nova versão (depois da primeira vez)

```bash
./enviar-alwaysdata.sh
```

Ou, sem SSH: `./build-deploy.sh` e reenviar a pasta `deploy/` por FTP.
Em ambos os casos, reinicie o site no painel (o script faz isso sozinho se você
preencher `API_KEY` e `SITE_ID` no `alwaysdata.conf`).

## Solução de problemas

- **Site com erro 502/504:** veja os logs no painel (**Web → Sites → Logs**).
  Quase sempre é o `.env` faltando ou o `DATABASE_URL` errado.
- **Tela de login aparece mas o acesso é negado:** confira `USUARIO_ACESSO` e
  `SENHA_ACESSO` no `.env` do servidor e reinicie o site (o `.env` só é lido
  na inicialização).
- **Erro "relation produtos does not exist":** o `schema.sql` não foi carregado
  no banco (passo 2).
- **Página em branco:** a pasta `public/` não foi enviada. Confira se
  `www/gestor-ml/public/index.html` existe no servidor.
- **Nunca rode `npm install` no servidor** — o limite de 256MB mata o processo.
  O pacote já vai com o `node_modules` pronto.
