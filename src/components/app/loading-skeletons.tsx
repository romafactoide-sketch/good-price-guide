import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder de tabela — evita tela vazia enquanto os dados carregam. */
export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft">
      <Skeleton className="h-4 w-40" />
      <div className="mt-5 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder de grade de cards. */
export function CardsSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Placeholder de blocos de indicadores. */
export function StatsSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
