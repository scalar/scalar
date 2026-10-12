import type { AsyncApiMessageObject } from '@scalar/types/asyncapi/3.1'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'

/** Merge message traits in order, then apply the message's own fields with highest priority. */
export const resolveMessageTraits = (message: AsyncApiMessageObject): AsyncApiMessageObject =>
  resolveTraits(message, message.traits ?? [])
