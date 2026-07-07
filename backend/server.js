// server.js — ponto de entrada do back-end GestorML
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const produtos = require('./routes/produtos');
const vendas = require('./routes/vendas');
const dashboard = require('./routes/dashboard');
const taxas = require('./routes/taxas');

const app = express();

// Permite o front (5173) chamar a API e ler JSON do corpo
app.use(cors());
app.use(express.json());

// Montagem das rotas da API
app.use('/api/produtos', produtos);
app.use('/api/vendas', vendas);
app.use('/api/dashboard', dashboard);
app.use('/api/taxas', taxas);

// ---------- Produção local: servir o front-end já compilado ----------
// Depois de rodar `npm run build` na pasta frontend, o Express entrega os
// arquivos de frontend/dist. Assim o vendedor abre tudo em http://localhost:3001
// sem precisar do servidor de desenvolvimento do Vite.
const pastaFront = path.join(__dirname, '../frontend/dist');
app.use(express.static(pastaFront));

// Qualquer rota que NÃO seja /api devolve o index.html (necessário para o
// React Router funcionar ao recarregar a página em /produtos, /dashboard, etc.)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(pastaFront, 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`GestorML backend rodando em http://localhost:${PORT}`);
});
