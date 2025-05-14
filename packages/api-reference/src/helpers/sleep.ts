/**
 * Little helper for sleeping for x milliseconds
 * an async await friendly setTimeout
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
