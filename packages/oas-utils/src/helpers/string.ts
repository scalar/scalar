/**
 * A collection of string manipulation helper methods
 */

/**
 * Converts a camelCase string to Title Words with spaces
 *
 * @param camelStr - MUST be in camelCase or this might not work
 */
export const camelToTitleWords = (camelStr: string) =>
  camelStr
    .replace(/([A-Z])/g, (match) => ` ${match}`)
    .replace(/^./, (match) => match.toUpperCase())
    .trim()

/**
 * Capitalize first letter
 * You should normally do this in css, only use this if you have to
 */
export const capitalize = (str: string) => str[0]?.toUpperCase() + str.slice(1)
