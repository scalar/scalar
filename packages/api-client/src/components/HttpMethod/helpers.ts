import {
  type RequestMethod,
  requestMethods,
} from '@scalar/oas-utils/entities/spec'

/** Type guard which takes in a string and returns true if it is in fact an HTTPMethod */
export const isHTTPMethod = (method: string): method is RequestMethod =>
  requestMethods.includes(method as RequestMethod)
