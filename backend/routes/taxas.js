// routes/taxas.js — leitura e edicao das taxas por canal
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/taxas — lista as 2 linhas (shopee e mercado_livre)
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query(
      'SELECT * FROM config_taxas ORDER BY canal'
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar taxas' });
  }
});

// PUT /api/taxas/:canal — atualiza percentual e taxa_fixa de um canal
router.put('/:canal', async (req, res) => {
  const { canal } = req.params;
  const { percentual, taxa_fixa } = req.body;

  if (percentual === undefined || Number(percentual) < 0) {
    return res.status(400).json({ erro: 'Percentual inválido' });
  }
  if (taxa_fixa === undefined || Number(taxa_fixa) < 0) {
    return res.status(400).json({ erro: 'Taxa fixa inválida' });
  }

  try {
    const resultado = await db.query(
      `UPDATE config_taxas SET
         percentual = $1,
         taxa_fixa = $2
       WHERE canal = $3
       RETURNING *`,
      [percentual, taxa_fixa, canal]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Canal não encontrado' });
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao atualizar taxa' });
  }
});

module.exports = router;
