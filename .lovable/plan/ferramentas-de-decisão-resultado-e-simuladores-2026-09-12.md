# Ferramentas de decisão: resultado e simuladores

Transformar o motor financeiro já existente em telas de decisão. Nenhuma fórmula nova dentro de componentes: tudo que for cálculo entra em `src/lib/pricing` com testes.

## 1. Novas funções no motor (com testes)

Acrescentar em `src/lib/pricing/engine.ts`, reaproveitando as funções atuais:

- `calculateMaxHealthyDiscount` — maior desconto (%) que ainda mantém a margem de contribuição na meta desejada. Resultado usado na mensagem "Acima deste desconto, sua margem ficará abaixo da meta."
- `calculateUnitProfit` — lucro unitário estimado (margem de contribuição menos rateio de custo fixo, quando houver base operacional informada).
- `calculateGoalPlan` — a partir de uma meta de lucro mensal: faturamento necessário, vendas necessárias, vendas por dia e ticket médio necessário, além do ponto de equilíbrio (usa `calculateBreakEvenRevenue` e a margem de contribuição média já existente).
- `calculatePriceScenario` — cenário "E se?": para um preço informado, devolve margem %, margem de contribuição em valor, lucro unitário, lucro mensal e a diferença mensal contra o preço atual (mesmo volume).

Novos testes em `src/lib/pricing/engine.test.ts` para cada função, incluindo taxa zero, margem zero, desconto que zera a margem, volume zero e valores inválidos.

## 2. Página "Resultado da precificação"

Nova rota `/app/resultado/$productId` (`src/routes/_authenticated/app.resultado.$productId.tsx`), acessível clicando no produto na tela de Precificação.

- Cabeçalho com nome, imagem (quando existir) e badge de situação.
- Três cards de preço: **Preço mínimo** (laranja), **Preço saudável** (verde, destaque maior, badge RECOMENDADO), **Preço estratégico** (roxo/azul, texto "Faixa sugerida para teste.").
- Bloco de indicadores: custo direto, perdas, custo variável, taxas, margem de contribuição, margem desejada, lucro unitário estimado e markup — cada um com explicação ao lado.
- Seção "Como chegamos neste preço?" em linguagem simples, com os números reais do produto (custo, % de taxas, margem desejada, preço recomendado).
- Seletor de canal de venda, para ver o resultado em cada canal.

## 3. Página de simuladores

Substituir o placeholder de `/app/simuladores` por três simuladores em abas, mais o ponto de equilíbrio visual.

- **E se eu vender por...** — escolhe produto, digita um preço e vê, em tempo real, margem, margem de contribuição, lucro unitário, lucro mensal e impacto mensal comparado ao preço atual. Aviso: "Considerando o mesmo volume informado."
- **Posso dar desconto?** — preço atual, desconto %, novo preço, margem resultante, lucro unitário, situação e o desconto máximo saudável com a mensagem de alerta.
- **Quanto preciso vender?** — meta de lucro mensal informada pelo usuário, resultando em faturamento necessário, vendas necessárias, vendas por dia, ticket médio necessário e ponto de equilíbrio.

Como o sistema ainda não guarda volume de vendas, cada simulador tem um campo "vendas por mês" (valor informado pelo usuário) usado nos cálculos mensais, com o aviso correspondente.

## 4. Ponto de equilíbrio visual

Novo componente `src/components/app/break-even-meter.tsx`: mostra custos fixos, margem de contribuição média, ponto de equilíbrio e meta, com uma barra visual marcando 0 → ponto de equilíbrio → meta. Usado na página de simuladores e no resultado do produto.

## Detalhes técnicos

- Dados sempre do negócio atual (`ensureWorkspace`), produtos/custos filtrados por `business_id`; canais via `listSalesChannels`.
- Dinheiro em centavos, percentuais 0–100; formatação por `formatBRLFromCents`.
- Erros de validação do motor (`PricingError`) exibidos como mensagem amigável na tela.
- Identidade visual, autenticação, RLS e layout principal permanecem intactos; cores dos cards usam tokens existentes (warning, primary, accent/roxo).
- Verificação: `bunx vitest run`, `bunx tsgo --noEmit`, lint e conferência das telas no navegador.
