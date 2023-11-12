// checks to see if a given url is valid
export function isValidUrl(url: string) {
  try {
    return Boolean(new URL(url))
  } catch (e) {
    return false
  }
}
