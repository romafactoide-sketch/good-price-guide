import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/metas")({
  head: () => ({
    meta: [
      { title: "Metas — PreçoSadio" },
      { name: "description", content: "Defina o lucro que você quer alcançar no mês." },
      { property: "og:title", content: "Metas — PreçoSadio" },
      { property: "og:description", content: "Defina o lucro que você quer alcançar no mês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Metas"
      description="Defina o lucro que você quer alcançar no mês."
      icon={Target}
      emptyTitle="Nenhuma meta definida"
      emptyDescription="Defina uma meta de faturamento ou de lucro para acompanhar o progresso."
      actionLabel="Nova meta"
    />
  );
}
