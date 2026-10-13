import { type InjectionKey, hasInjectionContext, inject, provide } from 'vue'

export type ToastOptions = {
  timeout?: number
  description?: string
}

export type ToastFunction = (message: string, level?: 'warn' | 'info' | 'error', options?: ToastOptions) => void | null

type ToastContext = {
  initializeToasts: (toastFunction: ToastFunction) => () => void
  toast: ToastFunction
}

/** Keep a renderer and its consumers together without sharing another embed's notifications. */
const createToastContext = (): ToastContext => {
  let renderer: ToastFunction = () => null
  return {
    initializeToasts: (toastFunction) => {
      renderer = toastFunction
      return () => {
        if (renderer === toastFunction) {
          renderer = () => null
        }
      }
    },
    toast: (message, level = 'info', options = { timeout: 3000 }) => renderer(message, level, options),
  }
}

const defaultContext = createToastContext()

/** Internal context shared by the embedded renderer and its consumers. */
export const toastContextKey: InjectionKey<ToastContext> = Symbol('scalar-toasts')

/** Give a Vue subtree its own notifications, including a renderer that stays in its DOM tree. */
export const provideToasts = (): void => {
  provide(toastContextKey, createToastContext())
}

/** Register the default renderer for applications using document-level notifications. */
export const initializeToasts = defaultContext.initializeToasts

/** Emit notifications through the nearest provider, or the default application renderer. */
export const useToasts = (): ToastContext =>
  hasInjectionContext() ? inject(toastContextKey, defaultContext) : defaultContext
