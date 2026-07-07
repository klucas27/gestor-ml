import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
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
        <div className="menu-rodape">Shopee · Mercado Livre</div>
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
