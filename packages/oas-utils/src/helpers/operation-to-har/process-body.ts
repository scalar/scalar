import type { OperationToHarProps } from '@/helpers/operation-to-har/operation-to-har'
import { isReference } from '@scalar/workspace-store/schemas/v3.1/type-guard'
import type { PostData } from 'har-format'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'operation'> &
  Required<Pick<OperationToHarProps, 'example'>>

/**
 * Processes the request body and returns the processed data
 */
export const processBody = ({ operation, contentType, example }: ProcessBodyProps): PostData => {
  const content = !operation.requestBody || isReference(operation.requestBody) ? {} : operation.requestBody.content
  const _contentType = contentType || Object.keys(content)[0]
  const text = JSON.stringify(example)

  return {
    mimeType: _contentType,
    text,
  }
}
