import { useEffect, useState } from 'react'
import { listarVendas, excluirVenda } from '../api.js'
import Icone from '../icones.jsx'

// Moeda em Real brasileiro
const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Rótulos amigáveis dos canais
const NOME_CANAL = {
  shopee: 'Shopee',
  mercado_livre: 'Mercado Livre',
}

// Recebe 'yyyy-mm-dd' (ou ISO com T) e devolve 'dd/mm/aaaa'
function formatarData(valor) {
  if (!valor) return ''
  const somenteData = String(valor).slice(0, 10)
  const [ano, mes, dia] = somenteData.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function Historico() {
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Filtros
  const [canal, setCanal] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const dados = await listarVendas({ canal, inicio, fim })
      setVendas(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canal, inicio, fim])

  function limparFiltros() {
    setCanal('')
    setInicio('')
    setFim('')
  }

  // Estorna a venda (devolve o estoque) após confirmação
  async function estornar(venda) {
    const ok = window.confirm(
      `Estornar a venda de "${venda.produto_nome}" de ${formatarData(
        venda.data
      )}? O estoque será devolvido.`
    )
    if (!ok) return
    setErro('')
    try {
      await excluirVenda(venda.id)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  // Soma do lucro das vendas filtradas (resumo acima da tabela)
  const lucroTotal = vendas.reduce((soma, v) => soma + Number(v.lucro || 0), 0)

  return (
    <div>
      <header className="cabecalho-pagina">
        <h1>Histórico de Vendas</h1>
        <p>Todas as vendas registradas; estorne uma venda para devolver o estoque.</p>
      </header>

      {/* ---------- Filtros ---------- */}
      <div className="cartao">
        <div className="filtro-periodo">
          <div className="campo">
            <label htmlFor="hist-canal">Canal</label>
            <select
              id="hist-canal"
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="shopee">Shopee</option>
              <option value="mercado_livre">Mercado Livre</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="hist-inicio">Início</label>
            <input
              id="hist-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="hist-fim">Fim</label>
            <input
              id="hist-fim"
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
          <div className="atalhos-periodo">
            <button
              type="button"
              className="botao secundario pequeno"
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {carregando ? (
        <div className="cartao">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="esqueleto"
              style={{ height: 20, marginBottom: i < 3 ? 14 : 0 }}
            />
          ))}
        </div>
      ) : vendas.length === 0 ? (
        <div className="estado-vazio">
          <span className="estado-vazio-icone">
            <Icone nome="historico" tamanho={20} />
          </span>
          <h3>Nenhuma venda encontrada</h3>
          <p>
            Nenhuma venda para este filtro. Registre uma venda ou ajuste o
            período e o canal acima.
          </p>
        </div>
      ) : (
        <>
          <p className="resumo-filtro">
            <strong>{vendas.length}</strong>{' '}
            {vendas.length === 1 ? 'venda' : 'vendas'} · Lucro total:{' '}
            <strong
              className={lucroTotal >= 0 ? 'lucro-positivo' : 'lucro-negativo'}
            >
              {moeda.format(lucroTotal)}
            </strong>
          </p>

          <div className="tabela-rolante">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Canal</th>
                  <th>Produto</th>
                  <th className="num">Qtd.</th>
                  <th className="num">Valor recebido</th>
                  <th className="num">Taxa</th>
                  <th className="num">Frete</th>
                  <th className="num">Lucro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr key={v.id}>
                    <td className="num">{formatarData(v.data)}</td>
                    <td>
                      <span className={`chip-canal ${v.canal}`}>
                        {NOME_CANAL[v.canal] || v.canal}
                      </span>
                    </td>
                    <td>{v.produto_nome}</td>
                    <td className="num">{v.quantidade}</td>
                    <td className="num">{moeda.format(v.valor_recebido)}</td>
                    <td className="num">{moeda.format(v.taxa)}</td>
                    <td className="num">{moeda.format(v.frete)}</td>
                    <td
                      className={
                        Number(v.lucro) >= 0
                          ? 'num lucro-positivo'
                          : 'num lucro-negativo'
                      }
                    >
                      {moeda.format(v.lucro)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="botao perigo pequeno"
                        onClick={() => estornar(v)}
                      >
                        Estornar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
