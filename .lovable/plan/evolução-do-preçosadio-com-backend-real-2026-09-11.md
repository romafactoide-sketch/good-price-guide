# Evolução do PreçoSadio com backend real

## Objetivo
Transformar as telas demonstrativas em uma experiência autenticada e persistente, preservando integralmente a identidade visual atual.

## O que será construído

### 1. Contas e segurança
- Ativar acesso por e-mail e senha e por Google.
- Conectar cadastro, entrada, recuperação e redefinição de senha às contas reais.
- Criar perfil individual com nome e e-mail.
- Proteger toda a área `/app`; visitantes sem sessão voltam para a entrada.
- Exibir dados reais do usuário e do negócio na barra lateral, com opção segura de sair.

### 2. Estrutura de dados
- Criar `profiles`, `businesses` e `fixed_costs`.
- Guardar valores monetários como inteiros em centavos, nunca como texto.
- Validar valores não negativos, categorias permitidas e tipo do negócio.
- Atualizar automaticamente `updated_at`.
- Aplicar permissões para que cada pessoa veja e altere somente seu perfil, seus negócios e os custos desses negócios.

### 3. Primeiro acesso e onboarding
- Criar fluxo autenticado em quatro etapas, mantendo o visual atual:
  1. Produtos, serviços ou ambos.
  2. Custos mensais predefinidos, inclusão de outros custos e total em tempo real.
  3. Pró-labore com explicação contextual.
  4. Vendas mensais, ticket médio e faturamento médio, todos opcionais.
- Salvar cada etapa automaticamente e permitir voltar sem perder dados.
- Mostrar progresso e retomar a última etapa incompleta.
- Ao concluir, marcar o negócio como configurado e abrir o dashboard.

### 4. Custos fixos
- Substituir a tela provisória por uma lista real com custo, categoria, valor e ações.
- Mostrar o total no topo.
- Permitir adicionar, editar e excluir com confirmação e mensagens de sucesso/erro.
- Oferecer as categorias Estrutura, Pessoal, Marketing, Administrativo, Tecnologia, Financeiro e Outro.
- Usar o mesmo formulário tanto no onboarding quanto na manutenção de custos.

### 5. Dashboard e dados demonstrativos
- Usar perfil, negócio, pró-labore, informações operacionais e custos reais onde já houver correspondência.
- Manter como demonstrativos apenas produtos, margens, gráfico e indicadores cuja lógica financeira avançada continua fora desta etapa.
- Identificar claramente esses dados como demonstração sem alterar a composição visual existente.

### 6. Validação
- Verificar cadastro, confirmação de e-mail, entrada, Google, recuperação e saída.
- Validar retomada do onboarding e operações de custos.
- Confirmar isolamento de dados com as regras do banco e executar a verificação de segurança.
- Revisar desktop e celular, além dos títulos e descrições de cada nova página.

## Detalhes técnicos
- A área autenticada ficará sob a proteção padrão do projeto, sem depender apenas de ocultação visual.
- As operações privadas usarão a sessão validada e as regras do banco como fronteira de segurança.
- Campos monetários usarão sufixo `_cents` no banco e utilitários compartilhados converterão entrada/saída para `R$ 1.234,56`.
- O perfil e o negócio inicial serão garantidos no primeiro acesso autenticado, usando os dados informados no cadastro; a criação não dependerá de código privilegiado no navegador.
- A confirmação de e-mail permanecerá habilitada: após cadastro, a pessoa verá uma orientação para confirmar o endereço antes de entrar.
