# Coração operacional do PreçoSadio

## Objetivo
Transformar Insumos e Produtos em áreas reais e persistentes, com ficha técnica, conversões de unidade, custos diretos e perdas, preservando todo o sistema e a identidade visual atuais.

## O que será construído

### 1. Insumos e unidades
- Criar cadastro, edição e exclusão de insumos vinculados ao negócio da pessoa conectada.
- Campos: nome, categoria, quantidade comprada, unidade de compra, preço pago, fornecedor opcional e data opcional.
- Suportar `g`, `kg`, `ml`, `L`, `unidade`, `metro`, `cm`, `pacote`, `caixa` e `outro`.
- Converter automaticamente unidades compatíveis: kg ↔ g, L ↔ ml e metro ↔ cm.
- Para unidade, pacote, caixa e outro, usar a própria unidade como base sem conversão implícita.
- Exibir em tempo real a unidade-base e o custo unitário com até quatro casas decimais, como `R$ 0,0215/g`.

### 2. Lista de insumos
- Substituir a tela provisória por uma lista real com nome, quantidade comprada, preço, custo unitário, quantidade de produtos relacionados, última atualização e ações.
- Adicionar busca por nome/fornecedor e filtros por categoria e unidade.
- Exibir o empty state solicitado quando não houver insumos.
- Ao alterar preço, quantidade ou unidade de um insumo associado, mostrar um modal com a quantidade e a lista dos produtos afetados antes de confirmar.
- Após a confirmação, atualizar os custos calculados das composições e os custos diretos dos produtos, sem alterar seus preços de venda.

### 3. Produtos em três etapas
- Substituir a tela provisória por uma lista real de produtos e botão `NOVO PRODUTO`.
- Etapa 1: nome, categoria, descrição, campo de imagem preparado sem upload nesta fase, preço atual e margem desejada.
- Etapa 2: selecionar insumos cadastrados, informar quantidade e unidade utilizada e visualizar o custo calculado de cada item.
- Etapa 3: adicionar vários custos diretos detalhados, cada um com nome, tipo (`Embalagem`, `Material adicional` ou `Outro`) e valor; informar também a perda na produção.
- Permitir avançar, voltar, editar produtos existentes e manter os dados preenchidos entre etapas.

### 4. Ficha técnica e cálculo
- Criar a ficha técnica de cada produto com sua composição completa.
- Somar ingredientes e itens diretos para obter o custo antes das perdas.
- Aplicar a perda pela fórmula de rendimento: `custo ajustado = custo antes das perdas ÷ (1 − percentual de perda)`.
- Calcular `perda estimada = custo ajustado − custo antes das perdas`.
- Mostrar custo antes das perdas, perda estimada e custo direto ajustado em tempo real.
- Bloquear percentuais de perda iguais ou superiores a 100% e combinações de unidades incompatíveis.
- Não recalcular nem sugerir preço final automaticamente nesta fase.

### 5. Persistência e segurança
- Criar `ingredients`, `products`, `product_ingredients` e uma tabela auxiliar de itens diretos detalhados.
- Guardar preços e totais monetários em centavos; guardar o custo unitário com precisão decimal suficiente para frações de centavo.
- Guardar unidade-base e valores normalizados para que os cálculos sejam reproduzíveis.
- Criar validações para quantidades, preços, margens, perdas, status e unidades permitidas.
- Atualizar `updated_at` automaticamente e manter contagens/associações consistentes ao excluir registros.
- Aplicar permissões para que cada pessoa acesse somente os insumos, produtos e composições do próprio negócio.

### 6. Integração visual e validação
- Reutilizar os campos de moeda, porcentagem, diálogos, tabelas, mensagens e estados vazios existentes.
- Manter a linguagem visual verde, clara, amigável e responsiva do PreçoSadio.
- Preservar os indicadores demonstrativos do dashboard; esta etapa não substituirá toda a análise financeira avançada.
- Adicionar títulos e descrições específicos às páginas e validar cadastro, filtros, conversões, ficha técnica, perdas, atualização de insumo e isolamento de dados.
- Revisar os fluxos em desktop e celular e executar as verificações de segurança do banco.

## Detalhes técnicos
- Conversões serão limitadas a famílias compatíveis: massa, volume e comprimento. Unidades de contagem não serão convertidas automaticamente entre si.
- Exemplo esperado: compra de 5 kg por R$ 200 gera base de 5.000 g e custo de R$ 0,04/g; uso de 180 g gera R$ 7,20.
- Custos calculados serão persistidos como retrato atual para listagem rápida e recalculados quando a composição ou um insumo associado mudar.
- `image_url` permanecerá disponível e vazio; armazenamento e envio de imagens ficam fora desta etapa.
- Exclusões destrutivas terão confirmação e mensagens claras de sucesso ou erro.
