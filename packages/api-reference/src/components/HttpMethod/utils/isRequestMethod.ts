import { type RequestMethod, validRequestMethods } from '../constants'

/** Checks whether a given request method is a valid request method */
export function isRequestMethod(s: string): s is RequestMethod {
  return validRequestMethods.includes(s as RequestMethod)
}
