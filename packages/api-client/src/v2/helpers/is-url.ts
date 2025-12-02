import { isValidUrl } from '@scalar/helpers/url/is-valid-url'

export const isUrl = (input: string) => {
  return (input.startsWith('http://') || input.startsWith('https://')) && isValidUrl(input)
}
