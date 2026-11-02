import { normalize as normalizeDocument } from '@scalar/json-magic/helpers/normalize'
import type { UnknownObject } from '@scalar/types/utils'

import type { Filesystem } from '@/types/index'

/**
 * Normalize an API description while preserving the parser's public types.
 * Objects and filesystems are returned unchanged by the shared normalizer.
 */
export const normalize = (content: string | UnknownObject | Filesystem): UnknownObject | Filesystem =>
  normalizeDocument(content) as UnknownObject | Filesystem
