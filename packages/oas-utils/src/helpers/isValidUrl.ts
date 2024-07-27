/**
 * Checks if a given string is a valid URL.
 *
 * @param {string} url - The string to be validated as a URL.
 * @returns {boolean} Returns true if the string is a valid URL, false otherwise.
 *
 * @example
 * isValidUrl('https://www.example.com'); // returns true
 * isValidUrl('not a url'); // returns false
 */
export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch (err) {
    return false
  }
}
