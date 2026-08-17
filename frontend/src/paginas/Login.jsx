import { useState } from 'react'
import { entrar } from '../api.js'
import Icone from '../icones.jsx'

// Tela de entrada do sistema. É a primeira coisa que aparece enquanto
// não houver um login válido guardado no navegador.
export default function Login({ aoEntrar, aviso }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      const dados = await entrar(usuario.trim(), senha)
      aoEntrar(dados.usuario)
    } catch (e) {
      setErro(e.message)
      setSenha('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="tela-login">
      <form className="cartao-login" onSubmit={enviar}>
        <div className="login-marca">
          <span className="logo-marca">
            <Icone nome="cifrao" tamanho={20} />
          </span>
          <div>
            <div className="logo-nome">GestorML</div>
            <div className="logo-descricao">Vendas e precificação</div>
          </div>
        </div>

        <h1 className="login-titulo">Entrar no sistema</h1>
        <p className="login-texto">
          Digite seu usuário e sua senha para acessar seus produtos, vendas e
          relatórios.
        </p>

        {aviso && !erro ? <div className="mensagem-erro">{aviso}</div> : null}
        {erro ? <div className="mensagem-erro">{erro}</div> : null}

        <div className="campo">
          <label htmlFor="usuario">Usuário</label>
          <input
            id="usuario"
            name="usuario"
            autoComplete="username"
            autoFocus
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="seu usuário"
          />
        </div>

        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="sua senha"
          />
        </div>

        <button className="botao login-botao" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="login-rodape">
          Esqueceu a senha? Ela fica no arquivo de configuração do sistema
          (<code>.env</code>) — peça ajuda a quem instalou o GestorML.
        </p>
      </form>
    </div>
  )
}
