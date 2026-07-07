// server.js — ponto de entrada do back-end GestorML
require('dotenv').config();
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

// Montagem das rotas
app.use('/api/produtos', produtos);
app.use('/api/vendas', vendas);
app.use('/api/dashboard', dashboard);
app.use('/api/taxas', taxas);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`GestorML backend rodando em http://localhost:${PORT}`);
});
