import type { AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import { resolveTraits } from '@/helpers/resolve-traits'

/** Merge operation traits in order, while keeping operation fields highest priority. */
export const resolveOperationWithTraits = (operation: AsyncApiOperationObject): AsyncApiOperationObject =>
  resolveTraits(operation, operation.traits ?? [])
