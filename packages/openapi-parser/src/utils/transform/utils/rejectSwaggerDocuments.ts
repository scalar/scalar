import type { AnyObject } from '../../../types'

export const rejectSwaggerDocuments = (defintion: AnyObject) => {
  if ('swagger' in defintion) {
    throw new Error(
      'Swagger 2.0 documents are not supported. Please upgrade to OpenAPI 3.x.',
    )
  }

  return defintion
}
