export type HealthStatus = "saudavel" | "atencao" | "critico";

export const demoUser = {
  name: "Maria",
  fullName: "Maria Souza",
  business: "Maria Doces",
  plan: "Pro",
  initials: "MS",
  email: "maria@mariadoces.com.br",
};

export const demoDashboard = {
  healthScore: 76,
  products: 18,
  healthy: 13,
  warning: 3,
  critical: 2,
  breakEven: 18420,
  goal: 32000,
  averageMargin: 24.8,
  projectedProfit: 7936,
};

export const demoMonthlySeries = [
  { mes: "Jan", faturamento: 19800, custos: 15200 },
  { mes: "Fev", faturamento: 21400, custos: 16100 },
  { mes: "Mar", faturamento: 23900, custos: 17050 },
  { mes: "Abr", faturamento: 22600, custos: 16800 },
  { mes: "Mai", faturamento: 26800, custos: 18300 },
  { mes: "Jun", faturamento: 29400, custos: 19100 },
  { mes: "Jul", faturamento: 31200, custos: 19850 },
];

export const demoProducts: {
  name: string;
  margin: number;
  price: number;
  cost: number;
  status: HealthStatus;
}[] = [
  { name: "Brigadeiro", margin: 28, price: 3.5, cost: 2.52, status: "saudavel" },
  { name: "Brownie", margin: 34, price: 12, cost: 7.92, status: "saudavel" },
  { name: "Bolo no pote", margin: 9, price: 15, cost: 13.65, status: "critico" },
  { name: "Kit festa", margin: 18, price: 189, cost: 154.98, status: "atencao" },
];

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (value: number) =>
  `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
