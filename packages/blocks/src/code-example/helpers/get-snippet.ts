import type { ErrorResponse } from '@scalar/helpers/errors/normalize-error'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import type { Request as HarRequest } from 'har-format'

import { getSnippetWithPlugin } from './get-snippet-with-plugin'

/** Generate a snippet synchronously using the complete generator registry. */
export const getSnippet = <T extends TargetId>(
  target: T | 'javascript',
  client: ClientId<T>,
  request: HarRequest,
): ErrorResponse<string> =>
  getSnippetWithPlugin(request, snippetz().findPlugin(target.replace('javascript', 'js'), client))
