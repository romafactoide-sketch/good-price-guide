import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/alertas")({
  head: () => ({
    meta: [
      { title: "Alertas — PreçoSadio" },
      { name: "description", content: "Avisos quando algum item começa a dar prejuízo." },
      { property: "og:title", content: "Alertas — PreçoSadio" },
      { property: "og:description", content: "Avisos quando algum item começa a dar prejuízo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Alertas"
      description="Avisos quando algum item começa a dar prejuízo."
      icon={Bell}
      emptyTitle="Nenhum alerta por aqui"
      emptyDescription="Tudo tranquilo: nenhum produto está com margem crítica agora."
      actionLabel="Configurar alertas"
    />
  );
}
