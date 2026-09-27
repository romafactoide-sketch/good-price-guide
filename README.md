# Preço Sadio

Quero iniciar a construção do micro-SaaS PreçoSadio.

O produto ajuda pequenos empreendedores a descobrir quanto realmente devem cobrar por seus produtos e serviços, considerando custos, despesas, margem, markup, ponto de equilíbrio e saúde financeira.

A proposta principal é:

Descubra quanto cobrar para seu negócio realmente dar lucro.

Neste primeiro momento, NÃO implemente ainda toda a lógica financeira nem funcionalidades avançadas.

Quero focar exclusivamente em:

identidade visual;

design system;

landing page pública;

login e cadastro;

estrutura visual interna do SaaS;

dashboard inicial com dados demonstrativos;

responsividade.

IDENTIDADE VISUAL

Nome:

PreçoSadio

Tagline:

Mais lucro para o seu esforço.

Estilo:

moderno;

simples;

premium;

amigável;

visual SaaS;

fácil para pessoas sem conhecimento financeiro.

Evitar qualquer aparência de sistema contábil antigo ou ERP complexo.

Use:

Verde principal: #16A34A

Verde escuro: #15803D

Verde claro: #DCFCE7

Background: #F8FAFC

Cards: #FFFFFF

Texto principal: #0F172A

Texto secundário: #64748B

Amarelo de atenção: #F59E0B

Vermelho crítico: #DC2626

Azul informativo: #2563EB

Utilizar:

cards com cantos arredondados;

sombras leves;

bordas discretas;

bastante espaço em branco;

ícones Lucide;

tipografia sans-serif moderna;

hierarquia visual forte;

gráficos limpos;

badges;

tooltips.

LANDING PAGE

Criar navbar com:

Logo PreçoSadio

Como funciona

Ferramentas

Planos

Entrar

Criar conta grátis

Hero:

Headline:

Descubra quanto cobrar para seu negócio realmente dar lucro.

Subheadline:

Cadastre seus custos e descubra seu preço mínimo, preço saudável, margem, markup e quanto precisa vender para atingir suas metas.

CTA principal:

CALCULAR MEU PREÇO GRÁTIS

CTA secundário:

VER COMO FUNCIONA

No lado direito do hero, criar mockup visual do dashboard mostrando:

preço mínimo;

preço saudável;

preço estratégico;

margem;

ponto de equilíbrio.

BENEFÍCIOS

Criar seção:

Pare de escolher seu preço no achismo.

Cards:

Descubra seu custo real

Proteja sua margem

Encontre seu ponto de equilíbrio

Simule preços

Planeje metas

Atualize custos

COMO FUNCIONA

Passo 1:

Cadastre seus custos.

Passo 2:

Adicione seu produto ou serviço.

Passo 3:

Descubra seu preço saudável.

Passo 4:

Monitore sua margem.

PLANOS

Criar visual para:

Free

Pro

Negócio

Ainda sem integração de pagamento.

LOGIN E CADASTRO

Criar telas:

Login

Cadastro

Recuperar senha

Cadastro:

Nome

E-mail

Senha

Nome do negócio

ÁREA INTERNA

Criar sidebar desktop:

Início

Produtos

Serviços

Insumos

Custos

Simuladores

Metas

Relatórios

Alertas

Configurações

Parte inferior:

Plano atual

Avatar

Nome do usuário

Nome do negócio

No mobile, transformar sidebar em drawer.

DASHBOARD DEMONSTRATIVO

Criar dados fictícios apenas para visualização.

Exemplo:

Usuária:

Maria

Empresa:

Maria Doces

Saúde do negócio:

76/100

Cards:

Produtos cadastrados: 18

Saudáveis: 13

Atenção: 3

Críticos: 2

Ponto de equilíbrio:

R$18.420

Meta:

R$32.000

Margem média:

24,8%

Lucro projetado:

R$7.936

Criar gráfico demonstrativo.

Criar lista de produtos:

Brigadeiro — 28% — saudável

Brownie — 34% — saudável

Bolo no pote — 9% — crítico

Kit festa — 18% — atenção

IMPORTANTE

Neste primeiro estágio, priorize UX/UI.

Crie componentes reutilizáveis:

Button

Card

Input

CurrencyInput

PercentageInput

Badge

Modal

Tooltip

ProgressBar

StatCard

EmptyState

PageHeader

DataTable

Sidebar

Não implemente lógica financeira complexa ainda.

Quero terminar esta etapa com um produto visualmente consistente e navegável.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://good-price-guide.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7537d99a-f115-4f4a-a67a-aa3e60e2f862).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
