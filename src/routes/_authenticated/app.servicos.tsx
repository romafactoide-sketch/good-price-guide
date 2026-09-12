import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — PreçoSadio" },
      {
        name: "description",
        content: "Precifique serviços considerando seu tempo e suas despesas.",
      },
      { property: "og:title", content: "Serviços — PreçoSadio" },
      {
        property: "og:description",
        content: "Precifique serviços considerando seu tempo e suas despesas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Serviços"
      description="Precifique serviços considerando seu tempo e suas despesas."
      icon={Wrench}
      emptyTitle="Nenhum serviço cadastrado"
      emptyDescription="Cadastre um serviço para calcular quanto cobrar por hora ou por atendimento."
      actionLabel="Novo serviço"
    />
  );
}
