/** Quote an HTTP field parameter, escaping quotes and backslashes as quoted-pairs. */
export const quoteHttpString = (value: string): string => `"${value.replace(/["\\]/g, '\\$&')}"`
