import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  cell: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  caption,
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          {caption ? (
            <caption className="px-5 pt-5 text-left text-sm text-muted-foreground">
              {caption}
            </caption>
          ) : null}
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    column.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                className="border-b border-border/70 last:border-0 hover:bg-muted/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-5 py-3.5 text-foreground",
                      column.align === "right" ? "text-right tabular-nums" : "text-left",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
