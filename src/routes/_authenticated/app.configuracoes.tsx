import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { ensureWorkspace } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/app/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — PreçoSadio" },
      { name: "description", content: "Atualize seus dados pessoais e o nome do negócio." },
      { property: "og:title", content: "Configurações — PreçoSadio" },
      { property: "og:description", content: "Dados da sua conta e do seu negócio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [profileId, setProfileId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([supabase.auth.getUser(), ensureWorkspace()]).then(async ([{ data }, business]) => {
      if (!data.user) return;
      setProfileId(data.user.id);
      setBusinessId(business.id);
      setBusinessName(business.name);
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,email")
        .eq("id", data.user.id)
        .single();
      setName(profile?.name ?? "");
      setEmail(profile?.email ?? data.user.email ?? "");
    });
  }, []);

  async function save() {
    setSaving(true);
    const [profileResult, businessResult] = await Promise.all([
      supabase.from("profiles").update({ name: name.trim() }).eq("id", profileId),
      supabase.from("businesses").update({ name: businessName.trim() }).eq("id", businessId),
    ]);
    setSaving(false);
    if (profileResult.error || businessResult.error) {
      toast.error("Não foi possível salvar as alterações.");
      return;
    }
    toast.success("Dados atualizados.");
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Configurações"
        description="Mantenha seus dados e as informações do negócio atualizados."
      />
      <section className="max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
        <h2 className="text-base font-bold">Conta e negócio</h2>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="profile-name">Seu nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input id="profile-email" value={email} disabled />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="business-name">Nome do negócio</Label>
            <Input
              id="business-name"
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
            />
          </div>
          <Button variant="hero" className="mt-2 w-full sm:w-fit" disabled={saving} onClick={save}>
            <Save />
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </section>
    </div>
  );
}
