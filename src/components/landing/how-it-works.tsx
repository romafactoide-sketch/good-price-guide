const steps = [
  {
    step: "1",
    title: "Cadastre seus custos.",
    text: "Insumos, embalagens, aluguel, energia e o seu tempo de trabalho.",
  },
  {
    step: "2",
    title: "Adicione seu produto ou serviço.",
    text: "Monte a ficha do que você vende, item por item.",
  },
  {
    step: "3",
    title: "Descubra seu preço saudável.",
    text: "Veja preço mínimo, saudável e estratégico com a margem de cada um.",
  },
  {
    step: "4",
    title: "Monitore sua margem.",
    text: "Alertas avisam quando algum item começa a dar prejuízo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-primary">Como funciona</span>
          <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
            Quatro passos até o preço certo.
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-2xl border border-border bg-background p-6 shadow-soft"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft">
                {item.step}
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
