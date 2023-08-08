import { nanoid } from 'nanoid'
import { type Component, reactive, readonly } from 'vue'

export type ToastStatus = 'Error'

type ToastOptions = {
  timeout?: number
}

type BaseToast = {
  id: string
  options?: ToastOptions
}

type DefaultToastContent = {
  title: string
  description?: Component | string
  status?: ToastStatus
}
type CustomToastContent = {
  component: Component
}

type ToastContent = DefaultToastContent | CustomToastContent

export type DefaultToast = DefaultToastContent & BaseToast
export type CustomToast = CustomToastContent & BaseToast
export type Toast = DefaultToast | CustomToast

export type ToastHandle = {
  id: string
  dismiss: () => void
  active: () => boolean
}

type Timer = ReturnType<typeof setTimeout>

/** A reactive array of all toasts */
const toasts = reactive<Toast[]>([])

function createToast(
  content: ToastContent,
  options?: ToastOptions,
): ToastHandle {
  const id = nanoid()
  toasts.push({ id, ...content, options })
  let timer: Timer | undefined
  if (options?.timeout) {
    timer = setTimeout(() => {
      removeToast(id)
    }, options.timeout)
  }
  const dismiss = () => {
    if (timer) clearTimeout(timer)
    removeToast(id)
  }
  const active = () => {
    return toasts.some((t) => t.id === id)
  }
  return { id, dismiss, active }
}

/** Shows a toast the given options */
export function addToast(
  contents: DefaultToastContent,
  options?: ToastOptions,
): ToastHandle {
  return createToast(contents, options)
}

/** Shows a toast with an error status */
export function addErrorToast(message: Component | string) {
  return createToast(
    {
      title: 'Something went wrong...',
      description: message,
      status: 'Error',
    },
    {
      timeout: 5000,
    },
  )
}

/** Shows a toast with a custom component */
export function addCustomToast(
  component: Component,
  options?: ToastOptions,
): ToastHandle {
  return createToast({ component }, options)
}

/** Gets access to all the toasts */
export function useToasts() {
  return {
    toasts: readonly(toasts) as Readonly<Toast[]>,
    addToast,
    removeToast,
    clearToasts,
  }
}

/** Remove a toast by id */
function removeToast(id: string) {
  const idx = toasts.findIndex((t) => t.id === id)
  if (idx < 0) return
  toasts.splice(idx, 1)
}

/** Clear all toasts */
function clearToasts() {
  toasts.splice(0, toasts.length)
}
