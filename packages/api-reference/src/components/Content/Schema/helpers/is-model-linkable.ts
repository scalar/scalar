import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'

import type { SchemaOptions } from '../types'

/** The slice of schema options needed to decide whether a model name renders as a link. */
export type ModelLinkOptions = Pick<SchemaOptions, 'hideModels' | 'document'>

/**
 * A model name normally links to its entry in the models section. It should render as plain
 * text when there is nothing to scroll to:
 *
 * - the whole models section is hidden via `hideModels`, or
 * - the referenced schema itself is hidden via `x-internal` / `x-scalar-ignore`.
 *
 * The hidden check mirrors how the sidebar decides which schemas to drop (see `traverseSchemas`),
 * so the link only shows when the model actually exists in the models section.
 */
export const isModelLinkable = (
  schemaKey: string | null | undefined,
  { hideModels, document }: ModelLinkOptions,
): boolean => {
  if (!schemaKey || hideModels) {
    return false
  }

  const schema = document?.components?.schemas?.[schemaKey]

  return !isHidden(getResolvedRef(schema, mergeSiblingReferences))
}
