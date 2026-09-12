import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="grid gap-3">
      <Button
        type="button"
        variant="subtle"
        size="lg"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError("");
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if (result.error) {
            setError("Não foi possível entrar com o Google. Tente novamente.");
            setLoading(false);
          }
        }}
        className="w-full"
      >
        <span className="text-base font-bold">G</span>
        {loading ? "Conectando..." : "Continuar com Google"}
      </Button>
      {error ? <p className="text-center text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou use seu e-mail
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
