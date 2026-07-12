// server.js — ponto de entrada do back-end GestorML
require('dotenv').config();
const fs = require('fs');
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

// ---------- Produção: servir o front-end já compilado ----------
// No deploy (alwaysdata) o script de build copia frontend/dist para
// backend/public, então o back-end é autossuficiente. Rodando localmente
// sem essa pasta, cai no frontend/dist como antes.
const pastaPublic = path.join(__dirname, 'public');
const pastaFront = fs.existsSync(pastaPublic)
  ? pastaPublic
  : path.join(__dirname, '../frontend/dist');
app.use(express.static(pastaFront));

// Qualquer rota que NÃO seja /api devolve o index.html (necessário para o
// React Router funcionar ao recarregar a página em /produtos, /dashboard, etc.)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(pastaFront, 'index.html'));
});

// No alwaysdata a porta é definida pela variável de ambiente PORT
// (o app deve escutar nela; o padrão do listen já cobre IPv4 e IPv6).
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GestorML backend rodando na porta ${PORT}`);
});
