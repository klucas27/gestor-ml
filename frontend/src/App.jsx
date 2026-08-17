import { useEffect, useState } from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { verificarSessao } from './api.js'
import { obterToken, obterUsuario, limparSessao } from './sessao.js'
import Login from './paginas/Login.jsx'
import Dashboard from './paginas/Dashboard.jsx'
import Produtos from './paginas/Produtos.jsx'
import RegistrarVenda from './paginas/RegistrarVenda.jsx'
import Historico from './paginas/Historico.jsx'
import Calculadora from './paginas/Calculadora.jsx'
import Icone from './icones.jsx'

// Tela de fallback para rota inexistente
function NaoEncontrada() {
  return (
    <div>
      <header className="cabecalho-pagina">
        <h1>Página não encontrada</h1>
        <p>Use o menu ao lado para navegar.</p>
      </header>
    </div>
  )
}

const itensMenu = [
  { para: '/dashboard', rotulo: 'Dashboard', icone: 'dashboard' },
  { para: '/produtos', rotulo: 'Produtos', icone: 'produtos' },
  { para: '/registrar-venda', rotulo: 'Registrar Venda', icone: 'venda' },
  { para: '/historico', rotulo: 'Histórico', icone: 'historico' },
  { para: '/calculadora', rotulo: 'Calculadora', icone: 'calculadora' },
]

export default function App() {
  // usuario = quem está logado (null = tela de login)
  const [usuario, setUsuario] = useState(obterUsuario())
  const [verificando, setVerificando] = useState(Boolean(obterToken()))
  const [aviso, setAviso] = useState('')

  // Ao abrir o sistema, confere se o token guardado no navegador ainda vale.
  useEffect(() => {
    if (!obterToken()) return
    let ativo = true
    verificarSessao()
      .then((dados) => {
        if (ativo) setUsuario(dados.usuario)
      })
      .catch(() => {
        if (ativo) setUsuario(null)
      })
      .finally(() => {
        if (ativo) setVerificando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  // Se qualquer chamada à API responder 401, volta para a tela de login.
  useEffect(() => {
    function expirou() {
      setUsuario(null)
      setAviso('Sua sessão expirou. Entre novamente.')
    }
    window.addEventListener('gestorml:sessao-expirada', expirou)
    return () => window.removeEventListener('gestorml:sessao-expirada', expirou)
  }, [])

  function sair() {
    limparSessao()
    setUsuario(null)
    setAviso('')
  }

  if (verificando) {
    return <div className="tela-login" aria-busy="true" />
  }

  if (!usuario) {
    return (
      <Login
        aviso={aviso}
        aoEntrar={(nome) => {
          setAviso('')
          setUsuario(nome)
        }}
      />
    )
  }

  return (
    <div className="app">
      <aside className="menu-lateral">
        <div className="logo">
          <span className="logo-marca">
            <Icone nome="cifrao" tamanho={18} />
          </span>
          <div>
            <div className="logo-nome">GestorML</div>
            <div className="logo-descricao">Vendas e precificação</div>
          </div>
        </div>
        <nav>
          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              className={({ isActive }) =>
                isActive ? 'link-menu ativo' : 'link-menu'
              }
            >
              <Icone nome={item.icone} />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="menu-rodape">
          <div className="menu-usuario">
            <span className="menu-usuario-nome">{usuario}</span>
            <button type="button" className="botao-sair" onClick={sair}>
              <Icone nome="sair" tamanho={16} />
              Sair
            </button>
          </div>
          <div>Shopee · Mercado Livre</div>
        </div>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/registrar-venda" element={<RegistrarVenda />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/calculadora" element={<Calculadora />} />
          <Route path="*" element={<NaoEncontrada />} />
        </Routes>
      </main>
    </div>
  )
}
