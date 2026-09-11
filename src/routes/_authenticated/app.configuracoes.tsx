import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — PreçoSadio" },
      { name: "description", content: "Dados do negócio, plano e preferências da conta." },
      { property: "og:title", content: "Configurações — PreçoSadio" },
      { property: "og:description", content: "Dados do negócio, plano e preferências da conta." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Configurações"
      description="Dados do negócio, plano e preferências da conta."
      icon={Settings}
      emptyTitle="Configurações em construção"
      emptyDescription="Em breve você poderá ajustar dados do negócio, equipe e plano por aqui."
      actionLabel="Editar negócio"
    />
  );
}
