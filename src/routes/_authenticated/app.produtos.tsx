import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";

export const Route = createFileRoute("/_authenticated/app/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — PreçoSadio" },
      { name: "description", content: "Cadastre o que você vende e acompanhe a margem de cada item." },
      { property: "og:title", content: "Produtos — PreçoSadio" },
      { property: "og:description", content: "Cadastre o que você vende e acompanhe a margem de cada item." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Produtos"
      description="Cadastre o que você vende e acompanhe a margem de cada item."
      icon={Package}
      emptyTitle="Nenhum produto cadastrado"
      emptyDescription="Adicione seu primeiro produto para descobrir o preço saudável dele."
      actionLabel="Novo produto"
    />
  );
}
