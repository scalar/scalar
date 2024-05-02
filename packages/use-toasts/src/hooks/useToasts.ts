export type ToastOptions = {
  timeout?: number
}

export type ToastFunction = (
  message: string,
  level?: 'warn' | 'info' | 'error',
  options?: ToastOptions,
) => void | null

const state: {
  toast: ToastFunction
} = {
  toast: () => null,
}

export function initializeToasts(toastFunction: ToastFunction) {
  state.toast = toastFunction
}

/** Emit toasts */
export function useToasts() {
  return {
    initializeToasts,
    toast: (
      message: string,
      level: 'warn' | 'info' | 'error' = 'info',
      options: ToastOptions = { timeout: 3000 },
    ) => {
      state.toast(message, level, options)
    },
  }
}
