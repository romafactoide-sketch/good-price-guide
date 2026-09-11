import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/custos")({
  head: () => ({
    meta: [
      { title: "Custos — PreçoSadio" },
      { name: "description", content: "Despesas fixas e variáveis do seu negócio." },
      { property: "og:title", content: "Custos — PreçoSadio" },
      { property: "og:description", content: "Despesas fixas e variáveis do seu negócio." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Custos"
      description="Despesas fixas e variáveis do seu negócio."
      icon={Receipt}
      emptyTitle="Nenhum custo cadastrado"
      emptyDescription="Registre aluguel, energia, taxas e demais despesas do mês."
      actionLabel="Novo custo"
    />
  );
}
