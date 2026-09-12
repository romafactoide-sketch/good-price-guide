/**
 * Controle central de planos do PreçoSadio.
 *
 * Toda checagem de plano acontece aqui: nenhum componente deve comparar
 * strings de plano diretamente. Funções puras e testáveis.
 */

export type PlanId = "free" | "pro" | "business";

export type FeatureId =
  | "pricing_calculator"
  | "margin"
  | "markup"
  | "simple_simulation"
  | "health_score"
  | "fixed_costs"
  | "break_even"
  | "simulators"
  | "alerts"
  | "goals"
  | "history"
  | "reports"
  | "channel_pricing"
  | "unlimited_products"
  | "unlimited_ingredients"
  | "multi_business"
  | "extra_users"
  | "units"
  | "consolidated_dashboard"
  | "advanced_reports";

export type PlanLimits = {
  /** null = ilimitado */
  businesses: number | null;
  products: number | null;
  ingredients: number | null;
};

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  tagline: string;
  limits: PlanLimits;
  features: FeatureId[];
  highlights: string[];
};

const freeFeatures: FeatureId[] = [
  "pricing_calculator",
  "margin",
  "markup",
  "simple_simulation",
  "health_score",
];

const proFeatures: FeatureId[] = [
  ...freeFeatures,
  "fixed_costs",
  "break_even",
  "simulators",
  "alerts",
  "goals",
  "history",
  "reports",
  "channel_pricing",
  "unlimited_products",
  "unlimited_ingredients",
];

const businessFeatures: FeatureId[] = [
  ...proFeatures,
  "multi_business",
  "extra_users",
  "units",
  "consolidated_dashboard",
  "advanced_reports",
];

export const plans: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    tagline: "Para começar a entender seus números.",
    limits: { businesses: 1, products: 3, ingredients: 5 },
    features: freeFeatures,
    highlights: [
      "1 negócio",
      "Até 3 produtos",
      "Até 5 insumos",
      "Calculadora de preço",
      "Margem e markup",
      "Simulação simples",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 2490,
    tagline: "Para proteger sua margem todos os meses.",
    limits: { businesses: 1, products: null, ingredients: null },
    features: proFeatures,
    highlights: [
      "1 negócio",
      "Produtos ilimitados",
      "Insumos ilimitados",
      "Custos fixos",
      "Ponto de equilíbrio",
      "Simuladores completos",
      "Alertas",
      "Metas",
      "Histórico",
      "Relatórios",
      "Precificação por canal",
    ],
  },
  business: {
    id: "business",
    name: "Negócio",
    priceCents: 4990,
    tagline: "Para quem tem mais de uma operação.",
    limits: { businesses: null, products: null, ingredients: null },
    features: businessFeatures,
    highlights: [
      "Tudo do Pro",
      "Mais de um negócio",
      "Usuários adicionais",
      "Unidades",
      "Dashboard consolidado",
      "Relatórios avançados",
    ],
  },
};

export const planOrder: PlanId[] = ["free", "pro", "business"];

export const isPlanId = (value: string): value is PlanId => value in plans;

export function getPlan(plan: PlanId) {
  return plans[plan];
}

export function getPlanLimits(plan: PlanId): PlanLimits {
  return plans[plan].limits;
}

export function canUseFeature(plan: PlanId, feature: FeatureId) {
  return plans[plan].features.includes(feature);
}

/** Menor plano que libera o recurso. */
export function requiredPlanFor(feature: FeatureId): PlanId {
  return planOrder.find((id) => canUseFeature(id, feature)) ?? "business";
}

export type LimitCheck = {
  allowed: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  message: string | null;
};

function checkLimit(limit: number | null, used: number, message: (limit: number) => string) {
  const current = Math.max(0, Math.floor(used));
  if (limit === null) {
    return { allowed: true, limit: null, used: current, remaining: null, message: null };
  }
  const allowed = current < limit;
  return {
    allowed,
    limit,
    used: current,
    remaining: Math.max(0, limit - current),
    message: allowed ? null : message(limit),
  } satisfies LimitCheck;
}

export function canCreateProduct(plan: PlanId, currentCount: number): LimitCheck {
  return checkLimit(
    getPlanLimits(plan).products,
    currentCount,
    (limit) => `Seu plano gratuito permite até ${limit} produtos.`,
  );
}

export function canCreateIngredient(plan: PlanId, currentCount: number): LimitCheck {
  return checkLimit(
    getPlanLimits(plan).ingredients,
    currentCount,
    (limit) => `Seu plano gratuito permite até ${limit} insumos.`,
  );
}

export function canCreateBusiness(plan: PlanId, currentCount: number): LimitCheck {
  return checkLimit(
    getPlanLimits(plan).businesses,
    currentCount,
    (limit) => `Seu plano atual permite ${limit} negócio.`,
  );
}

/** Benefício mostrado no paywall, por recurso. */
export const featureBenefits: Record<FeatureId, { title: string; benefit: string }> = {
  pricing_calculator: {
    title: "Calculadora de preço",
    benefit: "Descubra o preço saudável de cada produto.",
  },
  margin: { title: "Margem", benefit: "Veja quanto sobra em cada venda." },
  markup: { title: "Markup", benefit: "Saiba quantas vezes o custo o preço cobre." },
  simple_simulation: { title: "Simulação simples", benefit: "Teste um preço rapidamente." },
  health_score: {
    title: "Saúde dos produtos",
    benefit: "Veja quais produtos estão dando lucro de verdade.",
  },
  fixed_costs: {
    title: "Custos fixos",
    benefit: "Inclua aluguel, energia e pró-labore na conta e saiba quanto precisa vender.",
  },
  break_even: {
    title: "Ponto de equilíbrio",
    benefit: "Descubra o faturamento mínimo para o mês não fechar no vermelho.",
  },
  simulators: {
    title: "Simuladores",
    benefit: "Teste preços, descontos e metas antes de mexer na tabela.",
  },
  alerts: {
    title: "Alertas",
    benefit: "Receba um aviso quando um insumo sobe ou um produto perde margem.",
  },
  goals: {
    title: "Metas",
    benefit: "Defina quanto quer lucrar e veja quantas vendas isso exige.",
  },
  history: { title: "Histórico", benefit: "Acompanhe a evolução dos seus custos e margens." },
  reports: { title: "Relatórios", benefit: "Enxergue o resultado do mês em uma página." },
  channel_pricing: {
    title: "Precificação por canal",
    benefit: "Preço certo para balcão, delivery e marketplace, cada um com suas taxas.",
  },
  unlimited_products: {
    title: "Produtos ilimitados",
    benefit: "Cadastre quantos produtos quiser e precifique todo o seu catálogo.",
  },
  unlimited_ingredients: {
    title: "Insumos ilimitados",
    benefit: "Cadastre todos os seus insumos e tenha o custo real de cada receita.",
  },
  multi_business: { title: "Mais de um negócio", benefit: "Gerencie várias operações na mesma conta." },
  extra_users: { title: "Usuários adicionais", benefit: "Traga sua equipe para dentro." },
  units: { title: "Unidades", benefit: "Separe lojas e pontos de venda." },
  consolidated_dashboard: {
    title: "Dashboard consolidado",
    benefit: "Todos os negócios em um só painel.",
  },
  advanced_reports: { title: "Relatórios avançados", benefit: "Analise mix, canais e evolução." },
};

export const formatPlanPrice = (plan: Plan) =>
  plan.priceCents === 0
    ? "R$ 0"
    : `R$ ${(plan.priceCents / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
