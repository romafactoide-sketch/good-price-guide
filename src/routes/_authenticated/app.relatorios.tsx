import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — PreçoSadio" },
      { name: "description", content: "Visões consolidadas de margem, custos e resultado." },
      { property: "og:title", content: "Relatórios — PreçoSadio" },
      { property: "og:description", content: "Visões consolidadas de margem, custos e resultado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Relatórios"
      description="Visões consolidadas de margem, custos e resultado."
      icon={FileBarChart}
      emptyTitle="Nenhum relatório disponível"
      emptyDescription="Os relatórios aparecem aqui depois dos primeiros lançamentos."
      actionLabel="Gerar relatório"
    />
  );
}
