/**
 * Capitalize first letter
 * You should normally do this in css, only use this if you have to
 */
export const capitalize = (str = '') => (str[0]?.toUpperCase() ?? '') + str.slice(1)
