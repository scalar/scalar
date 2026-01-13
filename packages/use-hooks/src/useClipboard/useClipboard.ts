import { useToasts } from '@scalar/use-toasts'

import type { UseClipboardOptions } from './types'

/** Safely serialize a value to a string */
const serializeValue = (value: unknown) => {
  if (value === undefined) {
    return 'undefined'
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

/**
 * A hook for interacting with the clipboard
 */
export function useClipboard(opts: UseClipboardOptions = {}) {
  const { notify = (m) => toast(m, 'info') } = opts
  const { toast } = useToasts()

  async function copyToClipboard(value: unknown) {
    try {
      const serialized = serializeValue(value)
      await navigator.clipboard.writeText(serialized)
      notify('Copied to the clipboard')
    } catch (e) {
      const error = e as Error
      console.error(error.message)
      notify('Failed to copy to clipboard')
    }
  }

  return { copyToClipboard }
}
