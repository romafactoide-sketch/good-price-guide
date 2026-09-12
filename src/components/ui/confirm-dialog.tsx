import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

/**
 * Confirmação de ações destrutivas com o visual do produto (substitui window.confirm).
 * Uso: const { confirm, confirmDialog } = useConfirm(); ... if (!(await confirm({...}))) return;
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const confirmDialog: ReactNode = (
    <AlertDialog open={options !== null} onOpenChange={(open) => !open && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description ? (
            <AlertDialogDescription>{options.description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            {options?.cancelLabel ?? "Cancelar"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className="bg-danger text-white hover:bg-danger/90"
          >
            {options?.confirmLabel ?? "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
