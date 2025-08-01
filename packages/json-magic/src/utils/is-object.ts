/**
 * Check if the given value is an object
 */
export const isObject = (obj: any) => typeof obj === 'object' && !Array.isArray(obj) && obj !== null
