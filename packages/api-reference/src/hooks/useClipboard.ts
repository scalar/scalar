import { toast } from 'vue-sonner'

export const useClipboard = () => {
  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      toast('Copied to the clipboard.')
    })
  }
  return {
    copyToClipboard,
  }
}
