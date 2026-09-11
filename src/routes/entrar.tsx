import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — PreçoSadio" },
      { name: "description", content: "Acesse sua conta PreçoSadio e acompanhe suas margens." },
      { property: "og:title", content: "Entrar — PreçoSadio" },
      { property: "og:description", content: "Acesse sua conta PreçoSadio." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Entrar na sua conta"
      subtitle="Bem-vinda de volta. Vamos conferir suas margens."
      footer={
        <span className="text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/criar-conta" className="font-semibold text-primary hover:underline">
            Criar conta grátis
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
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@seunegocio.com" autoComplete="email" />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Senha</Label>
            <Link
              to="/recuperar-senha"
              className="text-xs font-medium text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
        </div>
        <Button type="submit" variant="hero" size="lg" className="mt-2 w-full">
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
