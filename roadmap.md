# Roadmap PreçoSadio

- [x] Identidade visual, design system, landing page e estrutura interna
- [x] Backend real: autenticação, perfil, negócios, onboarding, custos fixos
- [x] Coração operacional: insumos, unidades e conversões
- [x] Coração operacional: produtos, ficha técnica, composição e perdas
- [x] Atualização de custo dos produtos quando o insumo muda (sem alterar preço de venda)
- [x] Motor financeiro em `src/lib/pricing` (funções puras + 39 testes), canais de venda, preços mínimo/saudável/estratégico, markup, MC, ponto de equilíbrio e impacto de desconto
- [x] Dashboard: substituir os indicadores demonstrativos restantes por dados reais do negócio (demo só com VITE_DEMO_MODE=true)
- [x] Ferramentas de decisão: página "Resultado da precificação", simuladores "E se?", desconto e meta, ponto de equilíbrio visual (53 testes no motor)
- [x] Recorrência: score de saúde do negócio, classificação de produtos (saudável/atenção/crítico), página "Saúde dos produtos", alertas persistidos com filtros, planos Free/Pro/Negócio, limites centralizados em `src/lib/plans.ts`, paywall contextual e página de planos (67 testes)
- [ ] Integrar cobrança real (Stripe/Paddle) na troca de plano — hoje a troca é apenas registro interno

## Revisão pré-lançamento (em andamento)
- [x] SEO exato da landing (title, description, Open Graph e Twitter)
- [x] Módulo central de eventos (`src/lib/analytics.ts`) e instrumentação de cadastro, onboarding, produto, precificação, simuladores e paywall
- [x] Confirmações acessíveis de exclusão (produtos, insumos, custos) substituindo `window.confirm`
- [x] Skeletons de carregamento em produtos, insumos e custos
- [x] Mensagens de erro amigáveis com detalhe técnico só no console
- [ ] Verificação visual autenticada em desktop/tablet/celular e teste de isolamento com duas contas
- [ ] Cobrança real dos planos

## Kiwify Pro (preparação em branch Codex)
- [x] Mensal R$29,90 e anual R$247 recorrentes no mesmo produto; vitalício R$347 em produto separado
- [x] Registrar links e IDs dos produtos; checkout desabilitado até webhooks verificados
- [x] Remover ativação de plano pago pelo navegador; migração bloqueia escrita direta de assinaturas
- [x] Remover .env do índice Git e ignorar novos arquivos de ambiente
- [ ] Aplicar migração e confirmar fluxo de onboarding no banco
- [ ] Implementar webhook autenticado, idempotente, renovação, cancelamento, reembolso e vínculo entre compra e usuário
- [ ] Testar com duas contas e só depois habilitar os links de checkout
