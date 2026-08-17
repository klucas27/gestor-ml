// sessao.js — guarda o token de login no navegador
//
// O token é devolvido pelo back-end em /api/login e enviado em todas as
// chamadas seguintes. Fica no localStorage para o vendedor não precisar
// digitar a senha toda vez que abrir o sistema.
const CHAVE_TOKEN = 'gestorml.token'
const CHAVE_USUARIO = 'gestorml.usuario'

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function obterUsuario() {
  return localStorage.getItem(CHAVE_USUARIO)
}

export function salvarSessao(token, usuario) {
  localStorage.setItem(CHAVE_TOKEN, token)
  localStorage.setItem(CHAVE_USUARIO, usuario || '')
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN)
  localStorage.removeItem(CHAVE_USUARIO)
}

// Avisa o App quando o back-end responder 401 (token expirado ou inválido),
// para a tela de login aparecer sem recarregar a página.
export function avisarSessaoExpirada() {
  limparSessao()
  window.dispatchEvent(new Event('gestorml:sessao-expirada'))
}
