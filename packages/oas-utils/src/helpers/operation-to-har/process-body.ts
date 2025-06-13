import type { OperationToHarProps } from '@/helpers/operation-to-har/operation-to-har'
import type { PostData } from 'har-format'

type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'operation'> &
  Required<Pick<OperationToHarProps, 'example'>>

/**
 * Processes the request body and returns the processed data
 */
export const processBody = ({ operation, contentType, example }: ProcessBodyProps): PostData => {
  const _contentType = contentType || Object.keys(operation.requestBody?.content || {})[0]
  const text = JSON.stringify(example)

  return {
    mimeType: _contentType,
    text,
  }
}
