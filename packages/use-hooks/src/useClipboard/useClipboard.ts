import { useToasts } from '@scalar/use-toasts'

import type { UseClipboardOptions } from './types'

/**
 * A hook for interacting with the clipboard
 */
export function useClipboard(opts: UseClipboardOptions = {}) {
  const { notify = (m) => toast(m, 'info') } = opts
  const { toast } = useToasts()

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      notify('Copied to the clipboard')
    } catch (e) {
      const error = e as Error
      console.error(error.message)
      notify('Failed to copy to clipboard')
    }
  }

  return { copyToClipboard }
}
