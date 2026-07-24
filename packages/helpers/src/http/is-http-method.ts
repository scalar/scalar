import { httpMethods, type StandardHttpMethod } from './http-methods'

/** Type guard which takes in a string and returns true if it is in fact an HTTPMethod */
export const isHttpMethod = (method?: string | undefined): method is StandardHttpMethod =>
  method && typeof method === 'string' ? httpMethods.has(method.toLowerCase() as StandardHttpMethod) : false
