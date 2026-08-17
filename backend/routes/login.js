// routes/login.js — entrada e verificação de sessão
const express = require('express');
const { credenciaisValidas, gerarToken, exigirLogin } = require('../auth');

const router = express.Router();

// POST /api/login — recebe { usuario, senha } e devolve o token de acesso
router.post('/', (req, res) => {
  const { usuario, senha } = req.body || {};

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'Informe o usuário e a senha.' });
  }

  if (!credenciaisValidas(usuario, senha)) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
  }

  res.json({ token: gerarToken(), usuario });
});

// GET /api/login/sessao — o front usa para saber se o token guardado ainda vale
router.get('/sessao', exigirLogin, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
