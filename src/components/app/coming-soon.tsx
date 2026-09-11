import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export function ComingSoon({
  title,
  description,
  icon,
  emptyTitle,
  emptyDescription,
  actionLabel,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
}) {
  return (
    <div className="grid gap-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Button variant="hero">{actionLabel}</Button>}
      />
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
        action={<Button variant="subtle">{actionLabel}</Button>}
      />
    </div>
  );
}
