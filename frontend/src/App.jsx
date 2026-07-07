import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import Produtos from './paginas/Produtos.jsx'

// Placeholders das telas ainda não implementadas.
// Serão substituídas pelos arquivos reais nas próximas etapas.
function EmBreve({ titulo }) {
  return (
    <div>
      <h1>{titulo}</h1>
      <p className="aviso-vazio">Esta tela ainda será construída.</p>
    </div>
  )
}

const itensMenu = [
  { para: '/dashboard', rotulo: 'Dashboard' },
  { para: '/produtos', rotulo: 'Produtos' },
  { para: '/registrar-venda', rotulo: 'Registrar Venda' },
  { para: '/historico', rotulo: 'Histórico' },
  { para: '/calculadora', rotulo: 'Calculadora' },
]

export default function App() {
  return (
    <div className="app">
      <aside className="menu-lateral">
        <div className="logo">GestorML</div>
        <nav>
          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              className={({ isActive }) =>
                isActive ? 'link-menu ativo' : 'link-menu'
              }
            >
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<EmBreve titulo="Dashboard" />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route
            path="/registrar-venda"
            element={<EmBreve titulo="Registrar Venda" />}
          />
          <Route path="/historico" element={<EmBreve titulo="Histórico" />} />
          <Route
            path="/calculadora"
            element={<EmBreve titulo="Calculadora" />}
          />
          <Route path="*" element={<EmBreve titulo="Página não encontrada" />} />
        </Routes>
      </main>
    </div>
  )
}
