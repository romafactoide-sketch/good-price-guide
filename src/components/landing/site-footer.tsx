import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:flex sm:items-center sm:justify-between sm:px-6">
        <Logo showTagline />
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground">
            Como funciona
          </a>
          <a href="#planos" className="hover:text-foreground">
            Planos
          </a>
          <Link to="/entrar" className="hover:text-foreground">
            Entrar
          </Link>
        </nav>
      </div>
      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} PreçoSadio. Feito para pequenos negócios que querem lucrar.
      </div>
    </footer>
  );
}
