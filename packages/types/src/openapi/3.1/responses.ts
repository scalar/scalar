import type { ReferenceType } from './reference'
import type { ResponseObject } from './response'

export type ResponsesObject = Record<string, ReferenceType<ResponseObject>>
