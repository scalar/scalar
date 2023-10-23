import type { Tag, TransformedOperation } from '../types'
import { getTagSectionId } from './getTagSectionId'

export const getOperationSectionId = (
  operation: TransformedOperation,
  parentTag: Tag,
) => {
  return `${getTagSectionId(parentTag)}/[${operation.httpVerb}]${
    operation.path
  }`
}
