/** Available HTTP methods for Hono routes */
export const httpMethods = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'patch',
] as const

/** Valid HTTP method */
export type HttpMethod = (typeof httpMethods)[number]
