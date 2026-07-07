// routes/dashboard.js — indicadores agregados (SUM/GROUP BY no SQL)
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard?inicio=&fim= — devolve tudo em uma resposta JSON
router.get('/', async (req, res) => {
  const { inicio, fim } = req.query;

  // Monta filtro de periodo reutilizavel para todas as queries
  const condicoes = [];
  const params = [];
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
    // Totais gerais: faturamento, lucro, contagem e ticket medio
    const totais = await db.query(
      `SELECT
         COALESCE(SUM(v.valor_recebido), 0) AS faturamento,
         COALESCE(SUM(v.valor_recebido - v.taxa - v.frete - (p.custo * v.quantidade)), 0) AS lucro,
         COUNT(*) AS total_vendas,
         COALESCE(AVG(v.valor_recebido), 0) AS ticket_medio
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       ${where}`,
      params
    );

    // Faturamento e lucro por canal
    const porCanal = await db.query(
      `SELECT
         v.canal,
         COALESCE(SUM(v.valor_recebido), 0) AS total,
         COALESCE(SUM(v.valor_recebido - v.taxa - v.frete - (p.custo * v.quantidade)), 0) AS lucro
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       ${where}
       GROUP BY v.canal
       ORDER BY v.canal`,
      params
    );

    // Faturamento por dia
    const porDia = await db.query(
      `SELECT
         v.data,
         COALESCE(SUM(v.valor_recebido), 0) AS faturamento
       FROM vendas v
       ${where}
       GROUP BY v.data
       ORDER BY v.data`,
      params
    );

    // Top 5 produtos por quantidade vendida
    const topProdutos = await db.query(
      `SELECT
         p.nome,
         SUM(v.quantidade) AS quantidade_total
       FROM vendas v
       JOIN produtos p ON p.id = v.produto_id
       ${where}
       GROUP BY p.nome
       ORDER BY quantidade_total DESC
       LIMIT 5`,
      params
    );

    const t = totais.rows[0];
    res.json({
      faturamento: Number(t.faturamento),
      lucro: Number(t.lucro),
      total_vendas: Number(t.total_vendas),
      ticket_medio: Number(t.ticket_medio),
      por_canal: porCanal.rows,
      por_dia: porDia.rows,
      top_produtos: topProdutos.rows,
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao gerar dashboard' });
  }
});

module.exports = router;
