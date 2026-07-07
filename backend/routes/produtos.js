// routes/produtos.js — CRUD de produtos
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/produtos — lista todos, ordenados por nome, com flag estoque_baixo
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT *, (estoque <= estoque_minimo) AS estoque_baixo
         FROM produtos
        ORDER BY nome`
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

// POST /api/produtos — cria produto (nome obrigatorio, custo > 0)
router.post('/', async (req, res) => {
  const {
    nome,
    sku,
    custo,
    preco_shopee,
    preco_ml,
    estoque,
    estoque_minimo,
  } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }
  if (custo === undefined || Number(custo) <= 0) {
    return res.status(400).json({ erro: 'Custo deve ser maior que zero' });
  }

  try {
    const resultado = await db.query(
      `INSERT INTO produtos
         (nome, sku, custo, preco_shopee, preco_ml, estoque, estoque_minimo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nome,
        sku || null,
        custo,
        preco_shopee || null,
        preco_ml || null,
        estoque || 0,
        estoque_minimo || 3,
      ]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id — atualiza todos os campos
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    sku,
    custo,
    preco_shopee,
    preco_ml,
    estoque,
    estoque_minimo,
  } = req.body;

  if (!nome || nome.trim() === '') {
    return res.status(400).json({ erro: 'Nome é obrigatório' });
  }
  if (custo === undefined || Number(custo) <= 0) {
    return res.status(400).json({ erro: 'Custo deve ser maior que zero' });
  }

  try {
    const resultado = await db.query(
      `UPDATE produtos SET
         nome = $1,
         sku = $2,
         custo = $3,
         preco_shopee = $4,
         preco_ml = $5,
         estoque = $6,
         estoque_minimo = $7
       WHERE id = $8
       RETURNING *`,
      [
        nome,
        sku || null,
        custo,
        preco_shopee || null,
        preco_ml || null,
        estoque || 0,
        estoque_minimo || 3,
        id,
      ]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/produtos/:id — bloqueia se houver vendas (FK)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await db.query(
      'DELETE FROM produtos WHERE id = $1 RETURNING *',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    res.json({ mensagem: 'Produto excluído' });
  } catch (erro) {
    // 23503 = violacao de chave estrangeira (produto tem vendas)
    if (erro.code === '23503') {
      return res.status(409).json({ erro: 'Produto possui vendas registradas' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao excluir produto' });
  }
});

module.exports = router;
