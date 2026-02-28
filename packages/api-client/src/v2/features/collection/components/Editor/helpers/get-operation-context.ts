import { isHttpMethod } from '@scalar/helpers/http/is-http-method'

type OperationContext = {
  path: string
  method: string
}

/**
 * Returns an OperationContext if both path is provided and method is a valid HTTP method.
 * Returns null otherwise.
 */
export const getOperationContext = (path?: string, method?: string): OperationContext | null => {
  if (!path || !isHttpMethod(method)) {
    return null
  }

  return { path, method }
}
