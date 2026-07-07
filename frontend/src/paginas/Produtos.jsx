import { useEffect, useState } from 'react'
import {
  listarProdutos,
  criarProduto,
  editarProduto,
  excluirProduto,
} from '../api.js'
import Icone from '../icones.jsx'

// Estado inicial vazio do formulário
const FORM_VAZIO = {
  nome: '',
  sku: '',
  custo: '',
  preco_shopee: '',
  preco_ml: '',
  estoque: '',
  estoque_minimo: '',
}

// Formata número como preço em reais; mostra '—' quando vazio
function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`
}

// Esqueleto da tabela enquanto a lista carrega
function EsqueletoTabela() {
  return (
    <div className="cartao">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="esqueleto"
          style={{ height: 20, marginBottom: i < 3 ? 14 : 0 }}
        />
      ))}
    </div>
  )
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)

  // Controle do modal de formulário
  const [modalAberto, setModalAberto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)

  // Carrega a lista do back-end
  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      const dados = await listarProdutos()
      setProdutos(dados)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  // Fecha o modal com a tecla Escape
  useEffect(() => {
    if (!modalAberto) return
    function aoTeclar(evento) {
      if (evento.key === 'Escape') fecharModal()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [modalAberto])

  // Abre o modal para criar um novo produto
  function abrirNovo() {
    setEditandoId(null)
    setForm(FORM_VAZIO)
    setErro('')
    setModalAberto(true)
  }

  // Abre o modal preenchido para editar
  function abrirEdicao(produto) {
    setEditandoId(produto.id)
    setForm({
      nome: produto.nome ?? '',
      sku: produto.sku ?? '',
      custo: produto.custo ?? '',
      preco_shopee: produto.preco_shopee ?? '',
      preco_ml: produto.preco_ml ?? '',
      estoque: produto.estoque ?? '',
      estoque_minimo: produto.estoque_minimo ?? '',
    })
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditandoId(null)
    setForm(FORM_VAZIO)
  }

  // Atualiza um campo do formulário
  function mudarCampo(evento) {
    const { name, value } = evento.target
    setForm((atual) => ({ ...atual, [name]: value }))
  }

  // Converte string vazia em null e números em Number antes de enviar
  function prepararEnvio() {
    const paraNumero = (v) => (v === '' ? null : Number(v))
    return {
      nome: form.nome.trim(),
      sku: form.sku.trim() === '' ? null : form.sku.trim(),
      custo: paraNumero(form.custo),
      preco_shopee: paraNumero(form.preco_shopee),
      preco_ml: paraNumero(form.preco_ml),
      estoque: form.estoque === '' ? 0 : Number(form.estoque),
      estoque_minimo: form.estoque_minimo === '' ? 3 : Number(form.estoque_minimo),
    }
  }

  // Envia criação ou edição
  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const dados = prepararEnvio()
      if (editandoId) {
        await editarProduto(editandoId, dados)
      } else {
        await criarProduto(dados)
      }
      fecharModal()
      await carregar()
    } catch (e) {
      // Mantém o modal aberto e mostra o erro da API
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  // Exclui com confirmação
  async function remover(produto) {
    const ok = window.confirm(
      `Excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`
    )
    if (!ok) return
    setErro('')
    try {
      await excluirProduto(produto.id)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <div>
      <div className="barra-topo">
        <header className="cabecalho-pagina">
          <h1>Produtos</h1>
          <p>Cadastro, custos, preços por canal e controle de estoque.</p>
        </header>
        <button type="button" className="botao" onClick={abrirNovo}>
          + Novo produto
        </button>
      </div>

      {/* Erro fora do modal (lista/exclusão) */}
      {erro && !modalAberto && <div className="mensagem-erro">{erro}</div>}

      {carregando ? (
        <EsqueletoTabela />
      ) : produtos.length === 0 ? (
        <div className="estado-vazio">
          <span className="estado-vazio-icone">
            <Icone nome="produtos" tamanho={20} />
          </span>
          <h3>Nenhum produto cadastrado</h3>
          <p>
            Cadastre o primeiro produto com custo e preços para começar a
            registrar vendas e calcular o lucro.
          </p>
          <button type="button" className="botao" onClick={abrirNovo}>
            Cadastrar primeiro produto
          </button>
        </div>
      ) : (
        <div className="tabela-rolante">
          <table className="tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>SKU</th>
                <th className="num">Custo</th>
                <th className="num">Preço Shopee</th>
                <th className="num">Preço ML</th>
                <th className="num">Estoque</th>
                <th className="num">Estoque mín.</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.nome}
                    {p.estoque_baixo && (
                      <span className="badge-estoque-baixo">Estoque baixo</span>
                    )}
                  </td>
                  <td>{p.sku || '—'}</td>
                  <td className="num">{formatarPreco(p.custo)}</td>
                  <td className="num">{formatarPreco(p.preco_shopee)}</td>
                  <td className="num">{formatarPreco(p.preco_ml)}</td>
                  <td className="num">{p.estoque}</td>
                  <td className="num">{p.estoque_minimo}</td>
                  <td>
                    <div className="acoes-linha">
                      <button
                        type="button"
                        className="botao secundario pequeno"
                        onClick={() => abrirEdicao(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="botao perigo pequeno"
                        onClick={() => remover(p)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de criar/editar */}
      {modalAberto && (
        <div className="fundo-modal" onClick={fecharModal}>
          <div
            className="caixa-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editandoId ? 'Editar produto' : 'Novo produto'}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editandoId ? 'Editar produto' : 'Novo produto'}</h2>

            {erro && <div className="mensagem-erro">{erro}</div>}

            <form className="formulario" onSubmit={salvar}>
              <div className="campo">
                <label htmlFor="prod-nome">Nome *</label>
                <input
                  id="prod-nome"
                  name="nome"
                  value={form.nome}
                  onChange={mudarCampo}
                  autoFocus
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-sku">SKU (código seu, opcional)</label>
                <input
                  id="prod-sku"
                  name="sku"
                  value={form.sku}
                  onChange={mudarCampo}
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-custo">Custo *</label>
                <input
                  id="prod-custo"
                  name="custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.custo}
                  onChange={mudarCampo}
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-preco-shopee">Preço Shopee</label>
                <input
                  id="prod-preco-shopee"
                  name="preco_shopee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preco_shopee}
                  onChange={mudarCampo}
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-preco-ml">Preço Mercado Livre</label>
                <input
                  id="prod-preco-ml"
                  name="preco_ml"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preco_ml}
                  onChange={mudarCampo}
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-estoque">Estoque</label>
                <input
                  id="prod-estoque"
                  name="estoque"
                  type="number"
                  min="0"
                  value={form.estoque}
                  onChange={mudarCampo}
                />
              </div>

              <div className="campo">
                <label htmlFor="prod-estoque-min">Estoque mínimo</label>
                <input
                  id="prod-estoque-min"
                  name="estoque_minimo"
                  type="number"
                  min="0"
                  value={form.estoque_minimo}
                  onChange={mudarCampo}
                />
              </div>

              <div className="acoes-formulario">
                <button type="submit" className="botao" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  className="botao secundario"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
