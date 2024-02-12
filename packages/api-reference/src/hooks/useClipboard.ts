import { useToasts } from '@scalar/use-toasts'

const { addToast } = useToasts()

export const useClipboard = () => {
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      addToast({ title: 'Copied to the clipboard' }, { timeout: 2000 })
    })
  }
  return {
    copyToClipboard,
  }
}
