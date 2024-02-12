import { useToasts } from '@scalar/use-toasts'
import { useClipboard as useClipboardFromVueUse } from '@vueuse/core'
import { watch } from 'vue'

const { copy, copied } = useClipboardFromVueUse()
const { addToast } = useToasts()

/**
 * A hook to copy text to the clipboard and trigger a toast notification.
 */
export const useClipboard = () => {
  const copyToClipboard = (text: string) => {
    copy(text)

    watch(copied, (value: boolean) => {
      if (!value) {
        return
      }

      addToast(
        {
          title: 'Copied to the clipboard',
        },
        { timeout: 2000 },
      )
    })
  }

  return {
    copyToClipboard,
  }
}
