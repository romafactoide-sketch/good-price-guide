import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/app/simuladores")({
  head: () => ({
    meta: [
      { title: "Simuladores — PreçoSadio" },
      { name: "description", content: "Teste preços, descontos e combos antes de anunciar." },
      { property: "og:title", content: "Simuladores — PreçoSadio" },
      { property: "og:description", content: "Teste preços, descontos e combos antes de anunciar." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Simuladores"
      description="Teste preços, descontos e combos antes de anunciar."
      icon={SlidersHorizontal}
      emptyTitle="Nenhuma simulação criada"
      emptyDescription="Crie uma simulação para ver o impacto de um desconto na sua margem."
      actionLabel="Nova simulação"
    />
  );
}
