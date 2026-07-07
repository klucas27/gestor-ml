// api.js — funções de acesso ao back-end GestorML (http://localhost:3001)
const BASE = 'http://localhost:3001/api';

// Executa o fetch e trata o erro de forma padronizada.
// Se a resposta não for ok, lança Error com o campo "erro" do JSON.
async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(BASE + caminho, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });

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
