import { HTTP_METHODS } from '@scalar/helpers/http/http-methods'
import { literal, union } from '@scalar/validation'

/** HTTP method discriminator shared by operation and webhook navigation entries. */
export const httpMethodSchema = union(HTTP_METHODS.map((method) => literal(method)))
