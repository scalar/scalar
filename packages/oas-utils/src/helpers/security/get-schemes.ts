import type { SecurityScheme } from '@scalar/types/entities'

import type { Operation } from '@/entities/spec/operation.ts'
import { isDefined } from '@/helpers/is-defined.ts'

/** Parses a list of selected security scheme uids which may be an array or single uid and returns a flattened array of security schemes */
export const getSchemes = (
  selectedSecuritySchemes: Operation['selectedSecuritySchemeUids'],
  securitySchemes: Record<SecurityScheme['uid'], SecurityScheme>,
) => {
  const uids = new Set(selectedSecuritySchemes.flat())
  return Array.from(uids)
    .map((uid) => securitySchemes[uid])
    .filter(isDefined)
}
