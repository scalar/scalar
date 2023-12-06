import type { Tag, TransformedOperation } from '../types'
import { getTagSectionId } from './getTagSectionId'

export const getOperationSectionId = (
  operation: TransformedOperation,
  parentTag: Tag,
) => {
  console.log('========')
  console.log({ parentTag })
  console.log({ operation })
  return `${getTagSectionId(parentTag)}/[${operation.httpVerb}]${
    operation.path
  }`
}
