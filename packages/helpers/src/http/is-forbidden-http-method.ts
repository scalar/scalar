/** Methods forbidden by the Fetch standard, irrespective of their body semantics. */
export const isForbiddenHttpMethod = (method: string): boolean =>
  ['connect', 'trace', 'track'].includes(method.toLowerCase())
