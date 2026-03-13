import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { PostData } from 'har-format'
import type { OperationToHarProps } from './operation-to-har'
type ProcessBodyProps = Pick<OperationToHarProps, 'contentType' | 'example'> & {
  requestBody: RequestBodyObject
}
/**
 * Processes the request body and returns the processed data
 * Returns undefined if no example is found
 */
export declare const processBody: ({ requestBody, contentType, example }: ProcessBodyProps) => PostData | undefined
export {}
//# sourceMappingURL=process-body.d.ts.map
