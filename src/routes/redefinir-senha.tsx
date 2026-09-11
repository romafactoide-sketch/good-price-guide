import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({ meta: [
    { title: "Nova senha — PreçoSadio" },
    { name: "description", content: "Defina uma nova senha para sua conta PreçoSadio." },
    { property: "og:title", content: "Nova senha — PreçoSadio" },
    { property: "og:description", content: "Defina uma nova senha para sua conta." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const recovery = window.location.hash.includes("type=recovery");
    supabase.auth.getSession().then(({ data }) => setReady(recovery || Boolean(data.session)));
  }, []);

  return (
    <AuthLayout title="Crie uma nova senha" subtitle="Escolha uma senha segura com pelo menos 8 caracteres." footer={<Link to="/entrar" className="font-semibold text-primary hover:underline">Voltar para o login</Link>}>
      {!ready ? <p className="text-sm text-muted-foreground">Abra esta página pelo link enviado ao seu e-mail.</p> : (
        <form className="grid gap-4" onSubmit={async (event) => {
          event.preventDefault();
          if (password.length < 8) return setMessage("A senha precisa ter pelo menos 8 caracteres.");
          setLoading(true);
          const { error } = await supabase.auth.updateUser({ password });
          setLoading(false);
          if (error) return setMessage("Não foi possível atualizar a senha. Solicite um novo link.");
          navigate({ to: "/app" });
        }}>
          <div className="grid gap-1.5"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
          <Button type="submit" variant="hero" size="lg" disabled={loading}>{loading ? "Salvando..." : "Salvar nova senha"}</Button>
        </form>
      )}
    </AuthLayout>
  );
}