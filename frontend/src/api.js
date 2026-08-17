// api.js — funções de acesso ao back-end GestorML
// Em desenvolvimento (npm run dev) o front roda na porta 5173 e chama o
// back-end direto em http://localhost:3001. Em produção o Express serve o
// front e a API no MESMO endereço, então usamos o caminho relativo /api.
import { obterToken, salvarSessao, avisarSessaoExpirada } from './sessao.js';

const BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

// Executa o fetch e trata o erro de forma padronizada.
// Se a resposta não for ok, lança Error com o campo "erro" do JSON.
async function requisicao(caminho, opcoes = {}) {
  const token = obterToken();
  const resposta = await fetch(BASE + caminho, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      // Token do login: o back-end só responde às rotas protegidas com ele
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opcoes.headers || {}),
    },
  });

  // Token expirado ou inválido: derruba a sessão e volta para a tela de login
  if (resposta.status === 401 && caminho !== '/login') {
    avisarSessaoExpirada();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  // Tenta ler o corpo como JSON (pode estar vazio em alguns casos)
  let dados = null;
  const texto = await resposta.text();
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (!resposta.ok) {
    const mensagem = (dados && dados.erro) || 'Erro na requisição';
    throw new Error(mensagem);
  }

  return dados;
}

// Monta ?chave=valor apenas com os filtros preenchidos
function montarQuery(filtros = {}) {
  const partes = [];
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      partes.push(`${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`);
    }
  }
  return partes.length ? `?${partes.join('&')}` : '';
}

// ---------- LOGIN ----------
export async function entrar(usuario, senha) {
  const dados = await requisicao('/login', {
    method: 'POST',
    body: JSON.stringify({ usuario, senha }),
  });
  salvarSessao(dados.token, dados.usuario);
  return dados;
}

// Confere se o token guardado no navegador ainda é válido
export function verificarSessao() {
  return requisicao('/login/sessao');
}

// ---------- PRODUTOS ----------
export function listarProdutos() {
  return requisicao('/produtos');
}

export function criarProduto(produto) {
  return requisicao('/produtos', {
    method: 'POST',
    body: JSON.stringify(produto),
  });
}

export function editarProduto(id, produto) {
  return requisicao(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(produto),
  });
}

export function excluirProduto(id) {
  return requisicao(`/produtos/${id}`, { method: 'DELETE' });
}

// ---------- VENDAS ----------
export function listarVendas(filtros = {}) {
  // filtros aceitos: canal, inicio, fim
  return requisicao(`/vendas${montarQuery(filtros)}`);
}

export function criarVenda(venda) {
  return requisicao('/vendas', {
    method: 'POST',
    body: JSON.stringify(venda),
  });
}

export function excluirVenda(id) {
  return requisicao(`/vendas/${id}`, { method: 'DELETE' });
}

// ---------- DASHBOARD ----------
export function obterDashboard(filtros = {}) {
  // filtros aceitos: inicio, fim
  return requisicao(`/dashboard${montarQuery(filtros)}`);
}

// ---------- TAXAS ----------
export function listarTaxas() {
  return requisicao('/taxas');
}

export function atualizarTaxas(canal, taxa) {
  // taxa: { percentual, taxa_fixa }
  return requisicao(`/taxas/${canal}`, {
    method: 'PUT',
    body: JSON.stringify(taxa),
  });
}
