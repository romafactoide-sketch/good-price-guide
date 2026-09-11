import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ensureWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar — PreçoSadio" },
      { name: "description", content: "Acesse sua conta PreçoSadio e acompanhe suas margens." },
      { property: "og:title", content: "Entrar — PreçoSadio" },
      { property: "og:description", content: "Acesse sua conta PreçoSadio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      <div className="grid gap-5">
      <GoogleButton />
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          setError("");
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setError("E-mail ou senha incorretos.");
            setLoading(false);
            return;
          }
          const business = await ensureWorkspace();
          navigate({ to: business.onboarding_completed ? "/app" : "/onboarding" });
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@seunegocio.com" autoComplete="email" />
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
          <Input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="hero" size="lg" className="mt-2 w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      </div>
    </AuthLayout>
  );
}
