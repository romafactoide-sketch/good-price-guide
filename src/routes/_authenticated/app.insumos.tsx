import { createFileRoute } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/insumos")({
  head: () => ({
    meta: [
      { title: "Insumos — PreçoSadio" },
      { name: "description", content: "Materiais e ingredientes que compõem seus produtos." },
      { property: "og:title", content: "Insumos — PreçoSadio" },
      { property: "og:description", content: "Materiais e ingredientes que compõem seus produtos." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Insumos"
      description="Materiais e ingredientes que compõem seus produtos."
      icon={Boxes}
      emptyTitle="Nenhum insumo cadastrado"
      emptyDescription="Comece pelos insumos que você mais usa no dia a dia."
      actionLabel="Novo insumo"
    />
  );
}
