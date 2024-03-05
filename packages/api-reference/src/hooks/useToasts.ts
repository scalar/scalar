export type ToastFunction = (
  message: string,
  level?: 'warn' | 'info' | 'error',
) => void | null

const state: {
  toast: ToastFunction
} = {
  toast: (message) => null,
}

/**
 * Set the toast function that will be used throughout the app
 * If using APIReference Layouts directly this can use the parent app toast function
 */
export function initializeToasts(toastFunction: ToastFunction) {
  state.toast = toastFunction
}

/** Emit toasts */
export function useToasts() {
  return {
    initializeToasts,
    toast: state.toast,
  }
}
