import { useToasts } from '@scalar/use-toasts'

export const useClipboard = () => {
  const { toast } = useToasts()

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast('Copied to the clipboard', 'info')
    })
  }
  return {
    copyToClipboard,
  }
}
