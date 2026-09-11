import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const highlights = [
  "Preço mínimo, saudável e estratégico",
  "Margem e markup calculados por item",
  "Ponto de equilíbrio e metas do mês",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="hidden flex-col justify-between bg-gradient-primary p-10 lg:flex">
        <span className="rounded-xl bg-card/95 px-3 py-2">
          <Logo />
        </span>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight text-primary-foreground">
            Descubra quanto cobrar para seu negócio realmente dar lucro.
          </h2>
          <ul className="mt-7 grid gap-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-primary-foreground/90"
              >
                <Check className="mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-primary-foreground/75">
          Mais de 4.000 pequenos negócios precificando com clareza.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-2xl font-extrabold text-foreground lg:mt-0">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
            {children}
          </div>
          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
