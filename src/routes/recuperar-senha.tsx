import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — PreçoSadio" },
      { name: "description", content: "Receba um link por e-mail para criar uma nova senha." },
      { property: "og:title", content: "Recuperar senha — PreçoSadio" },
      { property: "og:description", content: "Recupere o acesso à sua conta PreçoSadio." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/entrar" className="font-semibold text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-dark">
            <MailCheck className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-foreground">Link enviado</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Confira sua caixa de entrada e siga as instruções do e-mail.
          </p>
          <Button variant="subtle" className="mt-5 w-full" onClick={() => setSent(false)}>
            Enviar novamente
          </Button>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            setError("");
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/redefinir-senha`,
            });
            setLoading(false);
            if (resetError) return setError("Não foi possível enviar o link. Tente novamente.");
            setSent(true);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@seunegocio.com" autoComplete="email" />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" variant="hero" size="lg" className="mt-2 w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
