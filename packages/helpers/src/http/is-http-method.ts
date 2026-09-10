import { type HttpMethod, httpMethods } from './http-methods'

const knownMethods: ReadonlySet<string> = httpMethods

/** Type guard which takes in a string and returns true if it is in fact an HTTPMethod */
export const isHttpMethod = (method?: string | undefined): method is HttpMethod =>
  method && typeof method === 'string' ? knownMethods.has(method.toLowerCase()) : false
