/**
 * Little helper for sleeping for x milliseconds
 * an async await friendly setTimeout
 *
 * @param ms - time to sleep in ms
 */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
