# DESIGN.md — Sistema visual do GestorML

Documento de referência do design da interface. Os valores abaixo estão
implementados como variáveis CSS (design tokens) em
`frontend/src/estilos.css` — mudanças de cor/forma devem ser feitas **nos
tokens**, nunca espalhadas pelo código.

## Identidade

Ferramenta de trabalho calma e confiável para um vendedor não-técnico.
A identidade gira em torno de **dinheiro/lucro**: neutros com leve tom
esverdeado e um acento verde-azulado (teal) para ações primárias e seleção.
O lucro é sempre verde quando positivo e vermelho quando negativo.

- **Registro:** produto (o design serve à tarefa; familiaridade > novidade)
- **Tema:** claro (uso diurno, entre o empacotamento de pedidos)
- **Estratégia de cor:** contida — neutros + 1 acento (≤10% da superfície)

## Cores (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--cor-fundo` | `#f4f6f5` | Fundo da página |
| `--cor-superficie` | `#ffffff` | Cartões, tabelas, inputs |
| `--cor-texto` | `#1b2420` | Texto principal |
| `--cor-texto-suave` | `#55625c` | Rótulos, subtítulos (AA ≥ 4.5:1) |
| `--cor-borda` | `#e2e8e5` | Bordas de cartão/tabela |
| `--cor-borda-input` | `#c4cfc9` | Bordas de campos |
| `--cor-acento` | `#0f766e` | Botão primário, item ativo do menu, links de dado |
| `--cor-acento-hover` / `--cor-acento-ativo` | `#0c5f58` / `#0a4f4a` | Estados do acento |
| `--cor-acento-tinta` | `#e9f4f2` | Fundos tingidos (preço sugerido, ícones de vazio) |
| `--cor-menu` | `#14231e` | Menu lateral (camada neutra escura) |
| `--cor-sucesso` / fundo | `#166534` / `#e7f4eb` | Mensagens de sucesso |
| `--cor-perigo` / fundo | `#b42318` / `#fdecea` | Erros, botão Excluir/Estornar, badge estoque baixo |
| `--cor-lucro-positivo` / `negativo` | `#15803d` / `#b42318` | Valores de lucro |
| Chips de canal | Shopee `#fdeee4`/`#9a3b12` · ML `#faf3d7`/`#6d5a0a` | Identificação do marketplace |

## Tipografia

- **Família:** pilha do sistema (`system-ui, -apple-system, 'Segoe UI', Roboto, Arial`).
- **Escala:** corpo 15px · tabelas 14px · rótulos 13px · h2 16px · h1 22px.
- **Números:** `font-variant-numeric: tabular-nums` em valores monetários e
  colunas numéricas (classe `.num`), sempre alinhados à direita nas tabelas.
- Padrão brasileiro em toda a interface: `R$ 1.234,56` e `dd/mm/aaaa`.

## Forma e profundidade

- **Raios:** controles (botões/inputs) 8px · cartões/tabelas 12px · modal 14px · chips/badges pílula.
- **Profundidade:** cartões usam só borda 1px (sem sombra); apenas o modal tem
  sombra (e não tem borda). Nunca os dois juntos.

## Componentes

- **Botões:** primário (acento sólido), secundário (contorno neutro), perigo
  (fundo vermelho tingido — destrutivo discreto), tamanho `pequeno` para linhas
  de tabela. Todos com estados hover/active/focus-visible/disabled.
- **Campos:** altura 38px, foco com borda no acento + anel
  `0 0 0 3px rgba(15,118,110,.25)`.
- **Menu lateral:** fundo `#14231e`, itens em "pílula" com ícone; o ativo tem
  fundo no acento (sem barrinha lateral). Vira barra no topo em telas < 700px.
- **Tabelas:** cabeçalho `#f7faf8`, colunas numéricas `.num` à direita, hover
  de linha `#f2f7f5`, rolagem horizontal via `.tabela-rolante`.
- **Esqueletos:** classe `.esqueleto` (shimmer) em todo carregamento — nunca
  texto "Carregando…".
- **Estados vazios:** `.estado-vazio` com ícone, título, explicação e, quando
  faz sentido, botão de ação (ex.: "Cadastrar primeiro produto").
- **Ícones:** traço 1.8px, 24×24, `currentColor` — todos em
  `frontend/src/icones.jsx`.

## Movimento

- Transições de 150ms (`ease-out`) em cor/borda/anel de botões, links e campos.
- Modal: fade do fundo (150ms) + subida do cartão (180ms).
- Tudo desligado sob `@media (prefers-reduced-motion: reduce)`.

## Acessibilidade

- Contraste AA (≥ 4.5:1) em todo texto, incluindo placeholder e rótulos.
- `:focus-visible` visível em todos os controles e links do menu.
- Modal com `role="dialog"`, `aria-modal`, fecha com Escape e clique no fundo.
- Todos os campos com `<label htmlFor>` associado.
- `<html lang="pt-BR">`.

## Gráficos (Recharts)

- Lucro (série principal): `#0f766e` · Faturamento (contexto): `#9db8b2`
  (dois passos do mesmo tom — o lucro é o protagonista).
- Grade horizontal `#e2e8e5`, eixos `#55625c` 12px, barras com topo
  arredondado `[4,4,0,0]`, tooltip formatado em R$.
