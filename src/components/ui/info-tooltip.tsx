import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Mais informações"
          className="text-muted-foreground/70 transition-colors hover:text-primary"
        >
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-relaxed">{content}</TooltipContent>
    </Tooltip>
  );
}
