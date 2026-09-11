import { Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showTagline = false,
  to = "/",
}: {
  className?: string;
  showTagline?: boolean;
  to?: string;
}) {
  return (
    <Link to={to} className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
        <Sprout className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[1.05rem] font-extrabold leading-none text-foreground">
          Preço<span className="text-primary">Sadio</span>
        </span>
        {showTagline ? (
          <span className="mt-1 block truncate text-[0.7rem] text-muted-foreground">
            Mais lucro para o seu esforço.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
