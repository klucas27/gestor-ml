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
import Icone from '../icones.jsx'

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

// Cores dos gráficos (alinhadas aos tokens do estilos.css)
const COR_ACENTO = '#0f766e' // lucro / série principal
const COR_APOIO = '#9db8b2' // faturamento (série de contexto)
const COR_GRADE = '#e2e8e5'
const COR_EIXO = '#55625c'

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

// Esqueleto exibido enquanto os dados carregam (evita "pulo" de layout)
function EsqueletoDashboard() {
  return (
    <>
      <div className="cards-grade">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card">
            <span className="esqueleto" style={{ width: '55%', height: 13 }} />
            <span className="esqueleto" style={{ width: '75%', height: 28 }} />
          </div>
        ))}
      </div>
      <div className="cartao">
        <span className="esqueleto" style={{ width: 240, height: 16, marginBottom: 16 }} />
        <span className="esqueleto" style={{ width: '100%', height: 260 }} />
      </div>
    </>
  )
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
      <header className="cabecalho-pagina">
        <h1>Dashboard</h1>
        <p>Resumo do faturamento, lucro e produtos mais vendidos no período.</p>
      </header>

      {/* ---------- Filtro de período ---------- */}
      <div className="cartao">
        <div className="filtro-periodo">
          <div className="campo">
            <label htmlFor="dash-inicio">Início</label>
            <input
              id="dash-inicio"
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="dash-fim">Fim</label>
            <input
              id="dash-fim"
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
        <EsqueletoDashboard />
      ) : semVendas ? (
        <div className="estado-vazio">
          <span className="estado-vazio-icone">
            <Icone nome="dashboard" tamanho={20} />
          </span>
          <h3>Nenhuma venda neste período</h3>
          <p>
            Ajuste o filtro de datas acima ou registre a primeira venda para
            ver os indicadores.
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
                  <CartesianGrid stroke={COR_GRADE} vertical={false} />
                  <XAxis
                    dataKey="canal"
                    tick={{ fill: COR_EIXO, fontSize: 12 }}
                    axisLine={{ stroke: COR_GRADE }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: COR_EIXO, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => moeda.format(v)} />
                  <Legend />
                  <Bar
                    dataKey="faturamento"
                    name="Faturamento"
                    fill={COR_APOIO}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="lucro"
                    name="Lucro"
                    fill={COR_ACENTO}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ---------- Gráfico de linha: por dia ---------- */}
            <div className="cartao">
              <h2>Faturamento por dia</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosDias}>
                  <CartesianGrid stroke={COR_GRADE} vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fill: COR_EIXO, fontSize: 12 }}
                    axisLine={{ stroke: COR_GRADE }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: COR_EIXO, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => moeda.format(v)} />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    name="Faturamento"
                    stroke={COR_ACENTO}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
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
                <div className="tabela-rolante" style={{ border: 'none' }}>
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produto</th>
                        <th className="num">Quantidade vendida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProdutos.map((p, indice) => (
                        <tr key={p.nome}>
                          <td className="num">{indice + 1}</td>
                          <td>{p.nome}</td>
                          <td className="num">{Number(p.quantidade_total)}</td>
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
