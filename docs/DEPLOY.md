# Deploy no alwaysdata (plano free)

Guia para publicar o GestorML no [alwaysdata](https://www.alwaysdata.com) e
deixar o deploy automático: todo `git push` na branch `main` compila o front,
envia tudo para o servidor e reinicia o site.

## Por que essa estratégia?

O plano free do alwaysdata tem **256MB de RAM**. Isso é suficiente para rodar
o Express (`node server.js` usa ~60-80MB), mas **não** é suficiente para rodar
`npm install` ou `vite build` — esses processos estouram a memória e são
mortos pelo servidor. Por isso:

- O **GitHub Actions** faz todo o trabalho pesado (instalar dependências e
  compilar o front) e envia só os arquivos prontos via `rsync`.
- O servidor apenas executa `node server.js`, que serve a API em `/api` e o
  front estático de `backend/public`.
- Docker fica **só no desenvolvimento** (banco local). Em produção o banco é
  o PostgreSQL do próprio alwaysdata.

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
3. Carregue o schema (e opcionalmente o seed) usando o **phpPgAdmin** do
   painel, ou via SSH:
   ```bash
   psql -h postgresql-minhaconta.alwaysdata.net -U usuario -d minhaconta_gestorml -f schema.sql
   ```

## Passo 3 — SSH e o arquivo .env do servidor

1. No painel, **Remote access → SSH**: habilite o usuário SSH (defina senha).
2. Gere um par de chaves na sua máquina (a chave privada vai para o GitHub):
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/alwaysdata_deploy -N ""
   ```
3. Instale a chave pública no servidor:
   ```bash
   ssh-copy-id -i ~/.ssh/alwaysdata_deploy.pub minhaconta@ssh-minhaconta.alwaysdata.net
   ```
4. Crie a pasta do app e o `.env` de produção (ele fica **só no servidor**,
   nunca no git — o deploy preserva esse arquivo):
   ```bash
   ssh -i ~/.ssh/alwaysdata_deploy minhaconta@ssh-minhaconta.alwaysdata.net
   mkdir -p ~/www/gestor-ml
   cat > ~/www/gestor-ml/.env <<'EOF'
   DATABASE_URL=postgres://usuario:senha@postgresql-minhaconta.alwaysdata.net:5432/minhaconta_gestorml
   USUARIO_ACESSO=vendedor
   SENHA_ACESSO=uma-senha-boa-aqui
   SEGREDO_TOKEN=cole-aqui-um-valor-aleatorio-longo
   EOF
   ```

   `USUARIO_ACESSO` e `SENHA_ACESSO` são o login da tela de entrada do
   sistema. `SEGREDO_TOKEN` assina o token de sessão — gere um valor
   aleatório com:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Trocar o `SEGREDO_TOKEN` desconecta quem já estava logado (útil se a senha
   vazar). Sem essas três variáveis o sistema sobe com o login padrão
   `vendedor` / `gestor123` — **não deixe assim em produção**.

## Passo 4 — API key do alwaysdata (para reiniciar o site)

1. No painel, canto superior direito → **Profile → API**: gere uma **API key**.
2. Descubra o **id do site**: abra **Web → Sites**, clique no site — o número
   está na URL do painel (ex.: `.../site/123456/`). Ou liste via API:
   ```bash
   curl --basic --user "SUA_API_KEY account=minhaconta:" https://api.alwaysdata.com/v1/site/
   ```

## Passo 5 — Secrets no GitHub

No repositório: **Settings → Secrets and variables → Actions → New repository
secret**. Cadastre os 6 secrets:

| Secret | Valor |
|---|---|
| `ALWAYSDATA_SSH_HOST` | `ssh-minhaconta.alwaysdata.net` |
| `ALWAYSDATA_SSH_USER` | `minhaconta` |
| `ALWAYSDATA_SSH_KEY` | conteúdo do arquivo `~/.ssh/alwaysdata_deploy` (chave **privada**, inteira) |
| `ALWAYSDATA_API_KEY` | a API key gerada no passo 4 |
| `ALWAYSDATA_ACCOUNT` | `minhaconta` |
| `ALWAYSDATA_SITE_ID` | o id numérico do site |

## Passo 6 — Pronto!

```bash
git push origin main
```

O workflow `.github/workflows/deploy.yml` roda automaticamente: compila o
front, copia para `backend/public`, instala as dependências de produção,
envia tudo por `rsync` para `~/www/gestor-ml/` e reinicia o site pela API.
Acompanhe na aba **Actions** do GitHub. O site fica em
`https://minhaconta.alwaysdata.net`.

## Caminho alternativo — deploy manual (sem GitHub Actions)

Se não quiser configurar os secrets, use os dois scripts da raiz do projeto.

```bash
./build-deploy.sh
```

Ele compila o front, copia o resultado para dentro do back-end e monta a pasta
`deploy/` — **back-end + front estático no mesmo lugar**, com o `node_modules`
de produção já instalado. Também gera `gestor-ml-deploy.tar.gz` para upload.
Conteúdo da pasta:

```
deploy/
  server.js  auth.js  db.js  package.json  package-lock.json
  routes/        (API: login, produtos, vendas, dashboard, taxas)
  public/        (front compilado — o Express serve daqui)
  node_modules/  (dependências de produção, prontas)
  schema.sql  seed.sql  .env.exemplo
```

Teste a pasta antes de subir (é exatamente o que roda no servidor):

```bash
cd deploy && node server.js     # http://localhost:3001
```

Para enviar, crie `alwaysdata.conf` na raiz do projeto (não vai para o git):

```bash
CONTA=minhaconta
SSH_HOST=ssh-minhaconta.alwaysdata.net
SSH_USER=minhaconta
PASTA_REMOTA=www/gestor-ml
API_KEY=          # opcional: reinicia o site sozinho
SITE_ID=          # opcional
```

E rode:

```bash
./enviar-alwaysdata.sh              # build + envio por rsync
./enviar-alwaysdata.sh --so-enviar  # envia a pasta deploy/ já pronta
```

O envio preserva o `.env` que está no servidor. Sem SSH, dá para subir o
`gestor-ml-deploy.tar.gz` pelo gerenciador de arquivos do painel
(**Remote access → FTP** ou **Files**) e extrair em `www/gestor-ml`.

## Testar o build localmente (opcional)

```bash
./build-deploy.sh        # gera deploy/ e o pacote .tar.gz
cd deploy && node server.js   # http://localhost:3001 com front + API juntos
```

## Solução de problemas

- **Site com erro 502/504:** veja os logs no painel (**Web → Sites → Logs**).
  Quase sempre é o `.env` faltando ou `DATABASE_URL` errado.
- **Deploy falha no rsync:** confira se a chave pública está no servidor
  (`~/.ssh/authorized_keys`) e se o SSH do usuário está habilitado no painel.
- **Restart falha (HTTP 401/404):** confira `ALWAYSDATA_API_KEY`,
  `ALWAYSDATA_ACCOUNT` e `ALWAYSDATA_SITE_ID`.
- **Nunca rode `npm install` no servidor** — o limite de 256MB mata o
  processo. O deploy já envia o `node_modules` pronto.
