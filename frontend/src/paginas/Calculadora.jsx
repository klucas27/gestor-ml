import { useEffect, useState } from 'react'
import { listarTaxas, atualizarTaxas } from '../api.js'

/*
  FÓRMULA DE PRECIFICAÇÃO (a parte mais importante para o vendedor)

  O marketplace cobra a taxa percentual SOBRE o preço de venda, não sobre o custo.
  Ou seja, quanto maior o preço, maior a taxa em reais. Por isso não dá para
  simplesmente "somar a taxa" ao custo — isso geraria um valor errado.

  Chamando:
    b = custo + frete + taxa_fixa   (custos fixos, em reais)
    p = percentual/100              (fração da taxa do marketplace)
    m = margem/100                  (fração de lucro desejada sobre o preço)
    P = preço de venda

  O preço precisa cobrir os custos fixos, a taxa percentual (p·P) e o lucro (m·P):
    P = b + p·P + m·P
    P − p·P − m·P = b
    P·(1 − p − m) = b
    P = b / (1 − p − m)

  Por isso DIVIDIMOS por (1 − p) (ou 1 − p − m), em vez de multiplicar.

  - Preço MÍNIMO (lucro zero, m = 0):   P = b / (1 − p)
  - Preço SUGERIDO (com a margem):      P = b / (1 − p − m)

  Se (p + m) >= 1 (ou seja, percentual + margem >= 100%), não existe preço
  possível: a taxa + a margem já consumiriam 100% ou mais do preço. Nesse caso
  mostramos um aviso em vez de um número negativo/sem sentido.
*/

const CANAIS = [
  { valor: 'shopee', rotulo: 'Shopee' },
  { valor: 'mercado_livre', rotulo: 'Mercado Livre' },
]

// Formata número em reais no padrão brasileiro: 17.5 -> "R$ 17,50"
function reais(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
}

export default function Calculadora() {
  // Entradas da calculadora
  const [custo, setCusto] = useState('')
  const [frete, setFrete] = useState('')
  const [margem, setMargem] = useState('')
  const [canal, setCanal] = useState('shopee')

  // Taxas vindas do back-end (lista com as 2 linhas: shopee e mercado_livre)
  const [taxas, setTaxas] = useState([])
  const [erro, setErro] = useState('')

  // Estado do formulário de "Configurar taxas"
  const [formTaxas, setFormTaxas] = useState({})
  const [salvandoCanal, setSalvandoCanal] = useState(null)
  const [mensagemTaxas, setMensagemTaxas] = useState('')

  // Carrega as taxas e preenche o formulário de edição
  async function carregarTaxas() {
    setErro('')
    try {
      const dados = await listarTaxas()
      setTaxas(dados)
      const inicial = {}
      for (const t of dados) {
        inicial[t.canal] = {
          percentual: t.percentual ?? '',
          taxa_fixa: t.taxa_fixa ?? '',
        }
      }
      setFormTaxas(inicial)
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregarTaxas()
  }, [])

  // Taxa do canal escolhido na calculadora
  const taxaCanal = taxas.find((t) => t.canal === canal)

  // Faz os cálculos apenas se houver taxa carregada e custo informado
  function calcular() {
    if (!taxaCanal) return null
    if (custo === '' || Number(custo) < 0) return null

    const b =
      Number(custo || 0) +
      Number(frete || 0) +
      Number(taxaCanal.taxa_fixa || 0)
    const p = Number(taxaCanal.percentual || 0) / 100
    const m = Number(margem || 0) / 100

    // Preço mínimo (lucro zero). Só é impossível se a taxa sozinha >= 100%.
    const minimoPossivel = 1 - p > 0
    const precoMinimo = minimoPossivel ? b / (1 - p) : null

    // Preço sugerido com a margem. Impossível se percentual + margem >= 100%.
    const sugeridoPossivel = 1 - p - m > 0
    const precoSugerido = sugeridoPossivel ? b / (1 - p - m) : null

    // Detalhamento no preço sugerido
    let taxaMarketplaceReais = null
    let lucro = null
    if (precoSugerido !== null) {
      taxaMarketplaceReais = p * precoSugerido + Number(taxaCanal.taxa_fixa || 0)
      lucro =
        precoSugerido -
        Number(custo || 0) -
        Number(frete || 0) -
        taxaMarketplaceReais
    }

    return {
      precoMinimo,
      precoSugerido,
      sugeridoPossivel,
      taxaMarketplaceReais,
      lucro,
    }
  }

  const resultado = calcular()

  // ----- Formulário de configuração de taxas -----
  function mudarFormTaxa(canalAlvo, campo, valor) {
    setFormTaxas((atual) => ({
      ...atual,
      [canalAlvo]: { ...atual[canalAlvo], [campo]: valor },
    }))
  }

  async function salvarTaxa(canalAlvo) {
    setSalvandoCanal(canalAlvo)
    setMensagemTaxas('')
    setErro('')
    try {
      const dados = formTaxas[canalAlvo]
      await atualizarTaxas(canalAlvo, {
        percentual: Number(dados.percentual || 0),
        taxa_fixa: Number(dados.taxa_fixa || 0),
      })
      setMensagemTaxas('Taxas atualizadas com sucesso.')
      await carregarTaxas()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvandoCanal(null)
    }
  }

  return (
    <div>
      <h1>Calculadora de Preço</h1>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {/* ---------- Entradas ---------- */}
      <div className="cartao">
        <div className="formulario">
          <div className="campo">
            <label>Custo do produto (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Frete pago pelo vendedor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={frete}
              onChange={(e) => setFrete(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Margem de lucro desejada (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={margem}
              onChange={(e) => setMargem(e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Canal</label>
            <select value={canal} onChange={(e) => setCanal(e.target.value)}>
              {CANAIS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {taxaCanal && (
          <p className="aviso-vazio">
            Taxa atual do canal: {Number(taxaCanal.percentual)}% +{' '}
            {reais(taxaCanal.taxa_fixa)} por venda.
          </p>
        )}
      </div>

      {/* ---------- Resultado ---------- */}
      {resultado && (
        <div className="cartao">
          <h2>Resultado</h2>

          <div className="grade-precos">
            <div className="preco-destaque">
              <span className="preco-rotulo">Preço mínimo (lucro zero)</span>
              <span className="preco-valor">
                {resultado.precoMinimo !== null
                  ? reais(resultado.precoMinimo)
                  : 'Impossível'}
              </span>
            </div>

            <div className="preco-destaque principal">
              <span className="preco-rotulo">Preço sugerido (com margem)</span>
              <span className="preco-valor">
                {resultado.sugeridoPossivel
                  ? reais(resultado.precoSugerido)
                  : '—'}
              </span>
            </div>
          </div>

          {!resultado.sugeridoPossivel && (
            <div className="mensagem-erro">
              Margem impossível para este canal (taxa + margem somam 100% ou
              mais do preço).
            </div>
          )}

          {resultado.sugeridoPossivel && (
            <div className="tabela-rolante">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Item (no preço sugerido)</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Custo do produto</td>
                    <td>{reais(custo || 0)}</td>
                  </tr>
                  <tr>
                    <td>Frete</td>
                    <td>{reais(frete || 0)}</td>
                  </tr>
                  <tr>
                    <td>Taxa do marketplace</td>
                    <td>{reais(resultado.taxaMarketplaceReais)}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Lucro por venda</strong>
                    </td>
                    <td>
                      <strong>{reais(resultado.lucro)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------- Configurar taxas ---------- */}
      <div className="cartao">
        <h2>Configurar taxas</h2>
        <p className="aviso-vazio">
          Atualize aqui quando o marketplace mudar as taxas. Vale para todos os
          cálculos e relatórios.
        </p>

        {mensagemTaxas && <div className="mensagem-sucesso">{mensagemTaxas}</div>}

        {CANAIS.map((c) => {
          const dados = formTaxas[c.valor] || { percentual: '', taxa_fixa: '' }
          return (
            <div key={c.valor} className="linha-taxa">
              <span className="linha-taxa-nome">{c.rotulo}</span>
              <div className="campo">
                <label>Percentual (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dados.percentual}
                  onChange={(e) =>
                    mudarFormTaxa(c.valor, 'percentual', e.target.value)
                  }
                />
              </div>
              <div className="campo">
                <label>Taxa fixa (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={dados.taxa_fixa}
                  onChange={(e) =>
                    mudarFormTaxa(c.valor, 'taxa_fixa', e.target.value)
                  }
                />
              </div>
              <button
                type="button"
                className="botao"
                onClick={() => salvarTaxa(c.valor)}
                disabled={salvandoCanal === c.valor}
              >
                {salvandoCanal === c.valor ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
