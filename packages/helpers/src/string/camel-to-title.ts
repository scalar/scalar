/**
 * Converts a camelCase string to Title Words with spaces
 *
 * @param camelStr - MUST be in camelCase or this might not work
 */
export const camelToTitleWords = (camelStr = '') =>
  camelStr
    .replace(/([A-Z]{2,})/g, ' $1') // Add space before consecutive capitals
    .replace(/([A-Z])(?=[a-z])/g, ' $1') // Add space before single capital followed by lowercase
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim()
