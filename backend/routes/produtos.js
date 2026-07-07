// routes/produtos.js — lista produtos (satisfaz o criterio de aceite)
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/produtos — retorna todos os produtos (lista vazia se nao houver)
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM produtos ORDER BY id');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

module.exports = router;
