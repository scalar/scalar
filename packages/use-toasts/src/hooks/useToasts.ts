export type ToastOptions = {
  timeout?: number
  description?: string
}

export type ToastFunction = (message: string, level?: 'warn' | 'info' | 'error', options?: ToastOptions) => void | null

/** Options for a toaster registering itself with {@link initializeToasts} */
export type ToasterOptions = {
  /**
   * Whether this toaster can currently show a toast where the user will see it
   *
   * Several toasters can be mounted at once (the API reference and the API client each mount
   * one), and one of them can sit inside something hidden, such as a closed modal. Toasts go to
   * the most recently registered toaster that is available.
   *
   * @default () => true
   */
  isAvailable?: () => boolean
}

type Toaster = {
  toast: ToastFunction
  isAvailable: () => boolean
}

/** Every mounted toaster, oldest first */
const toasters: Toaster[] = []

/**
 * Register a toaster to receive toasts
 *
 * @returns A function that unregisters the toaster again, for when it unmounts
 */
export function initializeToasts(toastFunction: ToastFunction, options: ToasterOptions = {}): () => void {
  const toaster: Toaster = { toast: toastFunction, isAvailable: options.isAvailable ?? (() => true) }
  toasters.push(toaster)

  return () => {
    const index = toasters.indexOf(toaster)
    if (index !== -1) {
      toasters.splice(index, 1)
    }
  }
}

/** The toaster a new toast should go to: the newest available one, or else the newest one */
const pickToaster = (): Toaster | undefined => {
  for (let index = toasters.length - 1; index >= 0; index--) {
    const toaster = toasters[index]
    if (toaster?.isAvailable()) {
      return toaster
    }
  }
  return toasters[toasters.length - 1]
}

/** Emit toasts */
export function useToasts() {
  return {
    initializeToasts,
    toast: (message: string, level: 'warn' | 'info' | 'error' = 'info', options: ToastOptions = { timeout: 3000 }) => {
      pickToaster()?.toast(message, level, options)
    },
  }
}
