import { useEffect, useState } from 'react'
import { listarProdutos, listarTaxas, criarVenda } from '../api.js'

// Formata número no padrão brasileiro: 17.5 -> "R$ 17,50"
function reais(valor) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

// Data de hoje em yyyy-mm-dd (para o input date)
function hojeISO() {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

const CANAIS = [
  { valor: 'shopee', rotulo: 'Shopee' },
  { valor: 'mercado_livre', rotulo: 'Mercado Livre' },
]

const FORM_VAZIO = {
  canal: 'shopee',
  produto_id: '',
  quantidade: '1',
  valor_recebido: '',
  taxa: '',
  frete: '',
  data: hojeISO(),
}

export default function RegistrarVenda() {
  const [produtos, setProdutos] = useState([])
  const [taxas, setTaxas] = useState([])
  const [form, setForm] = useState(FORM_VAZIO)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Carrega produtos (para o select) e taxas (para sugerir a taxa do canal)
  async function carregar() {
    setErro('')
    try {
      const [listaProdutos, listaTaxas] = await Promise.all([
        listarProdutos(),
        listarTaxas(),
      ])
      setProdutos(listaProdutos)
      setTaxas(listaTaxas)
    } catch (e) {
      setErro(e.message)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  function mudarCampo(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
    setSucesso('')
  }

  // Sugere a taxa do marketplace com base no canal e no valor recebido.
  // (percentual do canal SOBRE o valor + taxa fixa). O vendedor pode ajustar.
  function sugerirTaxa() {
    const config = taxas.find((t) => t.canal === form.canal)
    if (!config || form.valor_recebido === '') return
    const valor = Number(form.valor_recebido)
    const sugerida =
      (Number(config.percentual || 0) / 100) * valor +
      Number(config.taxa_fixa || 0)
    setForm((atual) => ({ ...atual, taxa: sugerida.toFixed(2) }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setErro('')
    setSucesso('')

    if (!form.produto_id) {
      setErro('Escolha um produto.')
      return
    }
    if (Number(form.quantidade) <= 0) {
      setErro('A quantidade deve ser maior que zero.')
      return
    }
    if (form.valor_recebido === '' || Number(form.valor_recebido) < 0) {
      setErro('Informe o valor recebido.')
      return
    }

    setSalvando(true)
    try {
      await criarVenda({
        canal: form.canal,
        produto_id: Number(form.produto_id),
        quantidade: Number(form.quantidade),
        valor_recebido: Number(form.valor_recebido),
        taxa: form.taxa === '' ? 0 : Number(form.taxa),
        frete: form.frete === '' ? 0 : Number(form.frete),
        data: form.data || null,
      })
      setSucesso('Venda registrada! O estoque foi baixado automaticamente.')
      // Limpa o formulário, mantendo canal e data para facilitar vendas seguidas
      setForm((atual) => ({
        ...FORM_VAZIO,
        canal: atual.canal,
        data: atual.data,
      }))
      await carregar() // atualiza o estoque mostrado
    } catch (e) {
      // Mensagens do back-end, ex.: "Estoque insuficiente"
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  // Produto selecionado (para mostrar o estoque e simular o lucro)
  const produtoSel = produtos.find((p) => String(p.id) === String(form.produto_id))

  // Simulação do lucro da venda enquanto o vendedor preenche o formulário:
  // lucro = valor recebido − taxa − frete − (custo × quantidade)
  const temSimulacao = produtoSel && form.valor_recebido !== ''
  const custoTotal = temSimulacao
    ? Number(produtoSel.custo || 0) * Number(form.quantidade || 0)
    : 0
  const lucroEstimado = temSimulacao
    ? Number(form.valor_recebido) -
      Number(form.taxa || 0) -
      Number(form.frete || 0) -
      custoTotal
    : 0

  return (
    <div>
      <header className="cabecalho-pagina">
        <h1>Registrar Venda</h1>
        <p>
          Anote cada venda; o estoque baixa sozinho e o lucro entra no
          Dashboard.
        </p>
      </header>

      {erro && <div className="mensagem-erro">{erro}</div>}
      {sucesso && <div className="mensagem-sucesso">{sucesso}</div>}

      <div className="duas-colunas">
        <div className="cartao">
          <form className="formulario" onSubmit={salvar}>
            <div className="campo">
              <label htmlFor="venda-canal">Canal</label>
              <select
                id="venda-canal"
                name="canal"
                value={form.canal}
                onChange={mudarCampo}
              >
                {CANAIS.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="venda-produto">Produto</label>
              <select
                id="venda-produto"
                name="produto_id"
                value={form.produto_id}
                onChange={mudarCampo}
              >
                <option value="">— escolha —</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (estoque: {p.estoque})
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="venda-quantidade">Quantidade</label>
              <input
                id="venda-quantidade"
                name="quantidade"
                type="number"
                min="1"
                value={form.quantidade}
                onChange={mudarCampo}
              />
            </div>

            <div className="campo">
              <label htmlFor="venda-valor">Valor recebido (R$)</label>
              <input
                id="venda-valor"
                name="valor_recebido"
                type="number"
                step="0.01"
                min="0"
                value={form.valor_recebido}
                onChange={mudarCampo}
                onBlur={sugerirTaxa}
              />
            </div>

            <div className="campo">
              <label htmlFor="venda-taxa">Taxa do marketplace (R$)</label>
              <input
                id="venda-taxa"
                name="taxa"
                type="number"
                step="0.01"
                min="0"
                value={form.taxa}
                onChange={mudarCampo}
                placeholder="preenchida ao sair do valor"
              />
            </div>

            <div className="campo">
              <label htmlFor="venda-frete">Frete pago (R$)</label>
              <input
                id="venda-frete"
                name="frete"
                type="number"
                step="0.01"
                min="0"
                value={form.frete}
                onChange={mudarCampo}
              />
            </div>

            <div className="campo">
              <label htmlFor="venda-data">Data da venda</label>
              <input
                id="venda-data"
                name="data"
                type="date"
                value={form.data}
                onChange={mudarCampo}
              />
            </div>

            <div className="acoes-formulario">
              <button type="submit" className="botao" disabled={salvando}>
                {salvando ? 'Registrando…' : 'Registrar venda'}
              </button>
            </div>
          </form>
        </div>

        {/* Resumo ao vivo: mostra o lucro estimado antes de salvar */}
        <div className="cartao resumo-venda">
          <h2>Resumo da venda</h2>

          {!produtoSel ? (
            <p className="aviso-vazio">
              Escolha um produto para ver o estoque e simular o lucro desta
              venda.
            </p>
          ) : (
            <>
              <div className="linha-resumo">
                <span>Estoque atual</span>
                <span className="num">{produtoSel.estoque} un.</span>
              </div>
              <div className="linha-resumo">
                <span>Custo unitário</span>
                <span className="num">{reais(produtoSel.custo)}</span>
              </div>

              {temSimulacao && (
                <>
                  <div className="linha-resumo">
                    <span>Custo × quantidade</span>
                    <span className="num">− {reais(custoTotal)}</span>
                  </div>
                  <div className="linha-resumo">
                    <span>Taxa do marketplace</span>
                    <span className="num">− {reais(form.taxa)}</span>
                  </div>
                  <div className="linha-resumo">
                    <span>Frete</span>
                    <span className="num">− {reais(form.frete)}</span>
                  </div>
                  <div className="linha-resumo destaque">
                    <span>Lucro estimado</span>
                    <span
                      className={
                        lucroEstimado >= 0
                          ? 'num lucro-positivo'
                          : 'num lucro-negativo'
                      }
                    >
                      {reais(lucroEstimado)}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
