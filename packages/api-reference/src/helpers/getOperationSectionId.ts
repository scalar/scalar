import { type TransformedOperation } from 'src/types'

export const getOperationSectionId = (operation: TransformedOperation) => {
  return `operation//[${operation.httpVerb}]${operation.path}`
}
