import {
  Calculator,
  RefreshCcw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Target,
} from "lucide-react";

const benefits = [
  {
    icon: Calculator,
    title: "Descubra seu custo real",
    text: "Insumos, embalagem, tempo e despesas fixas somados sem planilha.",
  },
  {
    icon: ShieldCheck,
    title: "Proteja sua margem",
    text: "Veja na hora quando um preço deixa de pagar o seu trabalho.",
  },
  {
    icon: Scale,
    title: "Encontre seu ponto de equilíbrio",
    text: "Saiba quanto precisa vender no mês para não ficar no vermelho.",
  },
  {
    icon: SlidersHorizontal,
    title: "Simule preços",
    text: "Teste descontos e combos antes de anunciar para o cliente.",
  },
  {
    icon: Target,
    title: "Planeje metas",
    text: "Defina o lucro que quer e descubra o caminho até ele.",
  },
  {
    icon: RefreshCcw,
    title: "Atualize custos",
    text: "Quando o insumo sobe, todos os preços são recalculados.",
  },
];

export function Benefits() {
  return (
    <section id="ferramentas" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Ferramentas</span>
        <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
          Pare de escolher seu preço no achismo.
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Tudo em linguagem simples, para quem entende do próprio negócio e não de contabilidade.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => (
          <article
            key={benefit.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary-dark">
              <benefit.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-base font-bold text-foreground">{benefit.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{benefit.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
