// routes/vendas.js — registro/listagem/estorno de vendas com controle de estoque
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/vendas — registra venda e baixa estoque na MESMA transacao
router.post('/', async (req, res) => {
  const {
    canal,
    produto_id,
    quantidade,
    valor_recebido,
    taxa,
    frete,
    data,
  } = req.body;

  // Validacoes basicas
  if (!canal || !['shopee', 'mercado_livre'].includes(canal)) {
    return res.status(400).json({ erro: 'Canal inválido' });
  }
  if (!produto_id) {
    return res.status(400).json({ erro: 'Produto é obrigatório' });
  }
  if (!quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });
  }
  if (valor_recebido === undefined || Number(valor_recebido) < 0) {
    return res.status(400).json({ erro: 'Valor recebido inválido' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // a) INSERT da venda
    const venda = await client.query(
      `INSERT INTO vendas
         (data, canal, produto_id, quantidade, valor_recebido, taxa, frete)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data || null,
        canal,
        produto_id,
        quantidade,
        valor_recebido,
        taxa || 0,
        frete || 0,
      ]
    );

    // b) UPDATE estoque so se houver estoque suficiente
    const baixa = await client.query(
      `UPDATE produtos
          SET estoque = estoque - $2
        WHERE id = $1 AND estoque >= $2`,
      [produto_id, quantidade]
    );

    // c) estoque insuficiente -> desfaz tudo
    if (baixa.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ erro: 'Estoque insuficiente' });
    }

    await client.query('COMMIT');
    res.status(201).json(venda.rows[0]);
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao registrar venda' });
  } finally {
    client.release();
  }
});

// GET /api/vendas?canal=&inicio=&fim= — lista com nome do produto e lucro calculado
router.get('/', async (req, res) => {
  const { canal, inicio, fim } = req.query;

  const condicoes = [];
  const params = [];

  if (canal) {
    params.push(canal);
    condicoes.push(`v.canal = $${params.length}`);
  }
  if (inicio) {
    params.push(inicio);
    condicoes.push(`v.data >= $${params.length}`);
  }
  if (fim) {
    params.push(fim);
    condicoes.push(`v.data <= $${params.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  try {
    const resultado = await db.query(
      `SELECT
         v.*,
         p.nome AS produto_nome,
         (v.valor_recebido - v.taxa - v.frete - (p.custo * v.quantidade)) AS lucro
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       ${where}
       ORDER BY v.data DESC, v.id DESC`,
      params
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// DELETE /api/vendas/:id — estorna venda e devolve estoque na MESMA transacao
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Apaga a venda e recupera produto_id/quantidade para estornar
    const venda = await client.query(
      'DELETE FROM vendas WHERE id = $1 RETURNING produto_id, quantidade',
      [id]
    );

    if (venda.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }

    const { produto_id, quantidade } = venda.rows[0];

    // Devolve a quantidade ao estoque
    await client.query(
      'UPDATE produtos SET estoque = estoque + $2 WHERE id = $1',
      [produto_id, quantidade]
    );

    await client.query('COMMIT');
    res.json({ mensagem: 'Venda estornada e estoque devolvido' });
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao estornar venda' });
  } finally {
    client.release();
  }
});

module.exports = router;
