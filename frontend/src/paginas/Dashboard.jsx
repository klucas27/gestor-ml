import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { obterDashboard } from '../api.js'

// Formatação de moeda em Real brasileiro
const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

// Rótulos amigáveis dos canais
const NOME_CANAL = {
  shopee: 'Shopee',
  mercado_livre: 'Mercado Livre',
}

// Converte Date para string yyyy-mm-dd (formato aceito pelo input date e pela API)
function paraISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Recebe 'yyyy-mm-dd' (ou ISO com T) e devolve 'dd/mm'
function formatarDiaMes(valor) {
  if (!valor) return ''
  const somenteData = String(valor).slice(0, 10) // ignora hora se vier ISO
  const [, mes, dia] = somenteData.split('-')
  return `${dia}/${mes}`
}

// Período inicial padrão: "Este mês" (primeiro dia do mês até hoje)
function periodoEsteMes() {
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  return { inicio: paraISO(inicio), fim: paraISO(hoje) }
}

export default function Dashboard() {
  const inicial = periodoEsteMes()
  const [inicio, setInicio] = useState(inicial.inicio)
  const [fim, setFim] = useState(inicial.fim)

  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  // Busca os dados sempre que o período muda
  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const resposta = await obterDashboard({ inicio, fim })
      setDados(resposta)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio, fim])

  // Atalhos de período
  function aplicarEsteMes() {
    const p = periodoEsteMes()
    setInicio(p.inicio)
    setFim(p.fim)
  }

  function aplicarUltimos30() {
    const hoje = new Date()
    const antes = new Date()
    antes.setDate(hoje.getDate() - 29) // 30 dias incluindo hoje
    setInicio(paraISO(antes))
    setFim(paraISO(hoje))
  }

  function aplicarTudo() {
    // Sem filtro: a API devolve tudo quando inicio/fim vazios
    setInicio('')
    setFim('')
  }

  // Prepara dados dos gráficos (converte strings numéricas do Postgres em Number)
  const dadosCanais =
    dados?.por_canal?.map((c) => ({
      canal: NOME_CANAL[c.canal] || c.canal,
      faturamento: Number(c.total),
      lucro: Number(c.lucro),
    })) || []

  const dadosDias =
    dados?.por_dia?.map((d) => ({
      dia: formatarDiaMes(d.data),
      faturamento: Number(d.faturamento),
    })) || []

  const topProdutos = dados?.top_produtos || []
  const semVendas = dados && Number(dados.total_vendas) === 0

  return (
    <div>
      <h1>Dashboard</h1>

      {/* ---------- Filtro de período ---------- */}
      <div className="cartao">
        <div className="filtro-periodo">
          <div className="campo">
            <label>Início</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Fim</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>
          <div className="atalhos-periodo">
            <button
              type="button"
              className="botao secundario pequeno"
              onClick={aplicarEsteMes}
            >
              Este mês
            </button>
            <button
              type="button"
              className="botao secundario pequeno"
              onClick={aplicarUltimos30}
            >
              Últimos 30 dias
            </button>
            <button
              type="button"
              className="botao secundario pequeno"
              onClick={aplicarTudo}
            >
              Tudo
            </button>
          </div>
        </div>
      </div>

      {erro && <div className="mensagem-erro">{erro}</div>}

      {carregando ? (
        <p>Carregando…</p>
      ) : semVendas ? (
        <div className="cartao">
          <p className="aviso-vazio">
            Nenhuma venda registrada neste período. Ajuste o filtro ou registre
            uma venda para ver os indicadores.
          </p>
        </div>
      ) : (
        dados && (
          <>
            {/* ---------- Cards ---------- */}
            <div className="cards-grade">
              <div className="card">
                <span className="card-rotulo">Faturamento</span>
                <span className="card-valor">
                  {moeda.format(dados.faturamento)}
                </span>
              </div>
              <div className="card">
                <span className="card-rotulo">Lucro</span>
                <span
                  className={
                    Number(dados.lucro) >= 0
                      ? 'card-valor positivo'
                      : 'card-valor negativo'
                  }
                >
                  {moeda.format(dados.lucro)}
                </span>
              </div>
              <div className="card">
                <span className="card-rotulo">Nº de vendas</span>
                <span className="card-valor">{dados.total_vendas}</span>
              </div>
              <div className="card">
                <span className="card-rotulo">Ticket médio</span>
                <span className="card-valor">
                  {moeda.format(dados.ticket_medio)}
                </span>
              </div>
            </div>

            {/* ---------- Gráfico de barras: por canal ---------- */}
            <div className="cartao">
              <h2>Faturamento e lucro por canal</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosCanais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="canal" />
                  <YAxis />
                  <Tooltip formatter={(v) => moeda.format(v)} />
                  <Legend />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" />
                  <Bar dataKey="lucro" name="Lucro" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ---------- Gráfico de linha: por dia ---------- */}
            <div className="cartao">
              <h2>Faturamento por dia</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosDias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip formatter={(v) => moeda.format(v)} />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ---------- Top 5 produtos ---------- */}
            <div className="cartao">
              <h2>Top 5 produtos mais vendidos</h2>
              {topProdutos.length === 0 ? (
                <p className="aviso-vazio">Sem dados de produtos no período.</p>
              ) : (
                <div className="tabela-rolante">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produto</th>
                        <th>Quantidade vendida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProdutos.map((p, indice) => (
                        <tr key={p.nome}>
                          <td>{indice + 1}</td>
                          <td>{p.nome}</td>
                          <td>{Number(p.quantidade_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  )
}
