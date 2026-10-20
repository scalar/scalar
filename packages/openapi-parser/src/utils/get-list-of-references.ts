import type { AnyObject } from '@scalar/types/utils'

import { getReferenceTargets } from './get-reference-targets'

/** Collect external reference filenames without interpreting instance data as references. */
export const getListOfReferences = (specification: AnyObject): string[] => [
  ...new Set(getReferenceTargets(specification).map(({ filename }) => filename)),
]
