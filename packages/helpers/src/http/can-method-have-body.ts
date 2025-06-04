import type { HttpMethod } from './http-methods'

/** HTTP Methods which can have a body */
const BODY_METHODS = ['post', 'put', 'patch', 'delete'] as const satisfies HttpMethod[]
type BodyMethod = (typeof BODY_METHODS)[number]

/** Makes a check to see if this method CAN have a body */
export const canMethodHaveBody = (method: HttpMethod): method is BodyMethod =>
  BODY_METHODS.includes(method.toLowerCase() as BodyMethod)
