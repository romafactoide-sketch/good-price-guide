import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      <div className="grid gap-5">
      <GoogleButton />
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (password.length < 8) return setMessage("A senha precisa ter pelo menos 8 caracteres.");
          setLoading(true);
          setMessage("");
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin, data: { name, business_name: business } },
          });
          setLoading(false);
          if (error) return setMessage("Não foi possível criar sua conta. Confira os dados e tente novamente.");
          if (!data.session) setMessage("Conta criada! Confira seu e-mail para confirmar o cadastro.");
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Maria Souza" autoComplete="name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@seunegocio.com" autoComplete="email" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="business">Nome do negócio</Label>
          <Input id="business" required value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="Maria Doces" />
        </div>
        {message ? <p className="text-center text-sm text-primary-dark">{message}</p> : null}
        <Button type="submit" variant="hero" size="lg" className="mt-2 w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Criar minha conta"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ao continuar você concorda com os termos de uso e a política de privacidade.
        </p>
      </form>
      </div>
    </AuthLayout>
  );
}
