import { readonly, ref } from 'vue'

export type UseFileDialogOptions = {
  multiple?: boolean
  /** @default '*' */
  accept?: string
  onChange?: (files: FileList | null) => void | Promise<void>
  onError?: () => void | Promise<void>
}

/**
 * Simplified interface for opening a file picker dialog
 * Derived from vueuse @see https://vueuse.org/useFileDialog
 */
export function useFileDialog({ multiple, accept, onChange, onError }: UseFileDialogOptions = {}) {
  const files = ref<FileList | null>(null)

  let input: HTMLInputElement | undefined
  if (typeof document !== 'undefined') {
    input = document.createElement('input')
    input.type = 'file'

    input.onchange = (event: Event) => {
      const result = event.target as HTMLInputElement
      files.value = result.files
      onChange?.(files.value)
    }

    input.onerror = () => onError?.()

    input.multiple = multiple!
    input.accept = accept!
  }

  const open = () => {
    if (!input) {
      return onError?.()
    }

    input.click()
  }

  return {
    files: readonly(files),
    open,
  }
}
