import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/criar-conta")({
  head: () => ({
    meta: [
      { title: "Criar conta grátis — PreçoSadio" },
      {
        name: "description",
        content: "Crie sua conta grátis e descubra o preço saudável dos seus produtos.",
      },
      { property: "og:title", content: "Criar conta grátis — PreçoSadio" },
      {
        property: "og:description",
        content: "Comece grátis e descubra quanto cobrar para dar lucro.",
      },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Criar conta grátis"
      subtitle="Leva menos de um minuto e não pedimos cartão."
      footer={
        <span className="text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/entrar" className="font-semibold text-primary hover:underline">
            Entrar
          </Link>
        </span>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ to: "/app" });
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" placeholder="Maria Souza" autoComplete="name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@seunegocio.com" autoComplete="email" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" placeholder="Mínimo de 8 caracteres" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="business">Nome do negócio</Label>
          <Input id="business" placeholder="Maria Doces" />
        </div>
        <Button type="submit" variant="hero" size="lg" className="mt-2 w-full">
          Criar minha conta
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ao continuar você concorda com os termos de uso e a política de privacidade.
        </p>
      </form>
    </AuthLayout>
  );
}
