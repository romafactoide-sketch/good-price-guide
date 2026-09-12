# Roadmap PreçoSadio

- [x] Identidade visual, design system, landing page e estrutura interna
- [x] Backend real: autenticação, perfil, negócios, onboarding, custos fixos
- [x] Coração operacional: insumos, unidades e conversões
- [x] Coração operacional: produtos, ficha técnica, composição e perdas
- [x] Atualização de custo dos produtos quando o insumo muda (sem alterar preço de venda)
- [x] Motor financeiro em `src/lib/pricing` (funções puras + 39 testes), canais de venda, preços mínimo/saudável/estratégico, markup, MC, ponto de equilíbrio e impacto de desconto
- [x] Dashboard: substituir os indicadores demonstrativos restantes por dados reais do negócio (demo só com VITE_DEMO_MODE=true)
- [x] Ferramentas de decisão: página "Resultado da precificação", simuladores "E se?", desconto e meta, ponto de equilíbrio visual (53 testes no motor)
