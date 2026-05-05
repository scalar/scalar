import { isValidUrl } from '@scalar/helpers/url/is-valid-url'

export const isUrl = (input: string) => {
  const trimmedInput = input.trim()

  return (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) && isValidUrl(trimmedInput)
}
