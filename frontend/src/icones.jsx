// icones.jsx — ícones SVG simples (traço, herdam a cor do texto via currentColor)

const CAMINHOS = {
  // Gráfico de barras (Dashboard)
  dashboard: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V6" />
      <path d="M17 16v-8" />
    </>
  ),
  // Caixa (Produtos)
  produtos: (
    <>
      <path d="M21 8l-9-4.5L3 8v8l9 4.5L21 16V8z" />
      <path d="M3 8l9 4.5L21 8" />
      <path d="M12 12.5V20" />
    </>
  ),
  // Mais em círculo (Registrar Venda)
  venda: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </>
  ),
  // Relógio (Histórico)
  historico: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Calculadora
  calculadora: (
    <>
      <rect x="5.5" y="3" width="13" height="18" rx="2" />
      <path d="M9 7.5h6" />
      <path d="M9 12h.01M12 12h.01M15 12h.01M9 15.5h.01M12 15.5h.01M15 15.5h.01" />
    </>
  ),
  // Cifrão (marca do GestorML e estados vazios de venda)
  cifrao: (
    <>
      <path d="M12 4v16" />
      <path d="M16 7.5c-.8-1-2.2-1.5-4-1.5-2.2 0-3.8 1.1-3.8 2.8 0 3.8 7.9 1.9 7.9 5.9 0 1.8-1.7 2.8-4.1 2.8-1.9 0-3.4-.6-4.2-1.6" />
    </>
  ),
}

export default function Icone({ nome, tamanho = 18 }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CAMINHOS[nome]}
    </svg>
  )
}
