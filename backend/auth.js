// auth.js — autenticação básica do GestorML
//
// O sistema é usado por UMA pessoa (o vendedor), então não há tabela de
// usuários: o usuário e a senha ficam no arquivo .env do servidor.
// Depois do login o back-end devolve um token assinado com HMAC-SHA256
// (segredo também no .env). O token guarda apenas o usuário e a data de
// expiração — nada de senha — e é verificado sem consultar o banco, o que
// mantém o login funcionando mesmo depois de o servidor reiniciar.
require('dotenv').config();
const crypto = require('crypto');

const USUARIO = process.env.USUARIO_ACESSO || 'vendedor';
const SENHA = process.env.SENHA_ACESSO || 'gestor123';
const SEGREDO = process.env.SEGREDO_TOKEN || 'segredo-de-desenvolvimento';
const DIAS_VALIDADE = 30;

// Compara dois textos em tempo constante (evita descobrir a senha medindo
// o tempo de resposta). Usa o hash para os dois lados terem o mesmo tamanho.
function compararSeguro(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function assinar(conteudo) {
  return crypto.createHmac('sha256', SEGREDO).update(conteudo).digest('base64url');
}

// Confere as credenciais enviadas na tela de login
function credenciaisValidas(usuario, senha) {
  return compararSeguro(usuario || '', USUARIO) && compararSeguro(senha || '', SENHA);
}

// Gera o token: "usuario.expiraEm.assinatura"
function gerarToken() {
  const expiraEm = Date.now() + DIAS_VALIDADE * 24 * 60 * 60 * 1000;
  const conteudo = `${Buffer.from(USUARIO).toString('base64url')}.${expiraEm}`;
  return `${conteudo}.${assinar(conteudo)}`;
}

// Verifica assinatura e validade. Devolve o usuário ou null.
function verificarToken(token) {
  if (!token || typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;

  const [usuarioB64, expiraEm, assinatura] = partes;
  const conteudo = `${usuarioB64}.${expiraEm}`;
  if (assinar(conteudo) !== assinatura) return null;
  if (!Number(expiraEm) || Number(expiraEm) < Date.now()) return null;

  return Buffer.from(usuarioB64, 'base64url').toString('utf8');
}

// Middleware: protege as rotas da API. O front envia o token no cabeçalho
// "Authorization: Bearer <token>".
function exigirLogin(req, res, next) {
  const cabecalho = req.headers.authorization || '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
  const usuario = verificarToken(token);

  if (!usuario) {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }

  req.usuario = usuario;
  next();
}

module.exports = { credenciaisValidas, gerarToken, verificarToken, exigirLogin, USUARIO };
