# Prints das telas

Capturas reais do sistema em funcionamento (tema claro, viewport 1360×850),
referenciadas no README principal:

- `print-dashboard.png` — Painel com cards de indicadores e gráficos (lucro em destaque)
- `print-produtos.png` — Lista de produtos com colunas numéricas alinhadas e ações por linha
- `print-calculadora.png` — Calculadora com preço mínimo, preço sugerido e detalhamento
- `print-registrar-venda.png` — Formulário de venda com painel "Resumo da venda" (lucro estimado ao vivo)
- `print-historico.png` — Histórico com chips de canal (Shopee/Mercado Livre) e lucro colorido

Para atualizar após mudanças visuais: rode o sistema
(`docker compose up -d` + `cd backend && npm start`), abra cada tela em
**http://localhost:3001** e capture novamente com os mesmos nomes.
