/** Whether this HTTP method and status allow a response body. */
export const canResponseHaveBody = (method: string, status: number): boolean =>
  method.toUpperCase() !== 'HEAD' && status >= 200 && status !== 204 && status !== 205 && status !== 304
