"use client"

import { Toast } from "@base-ui/react/toast"
import { cn } from "@/lib/utils"

/**
 * Base UI Toast primitives wrapped in the ArchStudio glass design system.
 * A single shared {@link toastManager} lets any module (including non-React
 * store code) push toasts from anywhere.
 */
const toastManager = Toast.createToastManager()

function ToastProvider({
  children,
  ...props
}: Toast.Provider.Props) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4000} limit={3} {...props}>
      {children}
      <Toaster />
    </Toast.Provider>
  )
}

/** Visual tone keyed off the toast `type` set by {@link pushToast}. */
function ToastTone({ toast }: { toast: Toast.Root.ToastObject }) {
  const tone =
    toast.type === "success"
      ? "text-emerald-600"
      : toast.type === "error"
        ? "text-destructive"
        : toast.type === "warning"
          ? "text-amber-500"
          : "text-primary"
  return <span className={cn("mt-0.5 shrink-0", tone)} aria-hidden>•</span>
}

function Toaster() {
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed top-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              "glass-panel pointer-events-auto flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm shadow-xl ring-1 ring-foreground/10 backdrop-blur-md",
              "data-ending-style:translate-x-2 data-ending-style:opacity-0 data-starting-style:translate-x-2 data-starting-style:opacity-0",
              "transition-all duration-200 ease-out",
            )}
          >
            <ToastTone toast={toast} />
            <Toast.Content className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden">
              {toast.title && (
                <Toast.Title className="text-sm font-medium text-foreground">
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description className="text-xs text-muted-foreground">
                  {toast.description}
                </Toast.Description>
              )}
            </Toast.Content>
            <Toast.Close
              aria-label="Fermer"
              className="-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              ✕
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  )
}

export type ToastType = "info" | "success" | "error" | "warning"

/** Push a toast from anywhere (React or plain module code). */
export function pushToast(
  title: string,
  options: { description?: string; type?: ToastType } = {},
): string {
  return toastManager.add({
    title,
    description: options.description,
    type: options.type ?? "info",
  })
}

export { ToastProvider, toastManager }
