import { type ClientId, type TargetId } from '@scalar/snippetz'
import type { Request as HarRequest } from 'har-format'
import type { ErrorResponse } from '@/temp/libs/errors'
/**
 * Returns a code example for given operation
 */
export declare const getSnippet: <T extends TargetId>(
  target: T | 'javascript',
  client: ClientId<T>,
  harRequest: HarRequest,
) => ErrorResponse<string>
//# sourceMappingURL=get-snippet.d.ts.map
