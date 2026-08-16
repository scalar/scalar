import type { TraversedEntry } from '@scalar/workspace-store/schemas/navigation'

/**
 * Builds a mapping from model names to their sidebar entry IDs.
 *
 * The map powers the `scroll-to:model-by-name` navigation used by model-name links
 * (for example the `Satellite[]` link next to a property type, or a request-body model name).
 *
 * Model entries do not always live under the top-level `models` group: a component schema with an
 * `x-tags` extension is placed under its tag group instead. To keep those links working we walk the
 * whole navigation tree and collect every `type === 'model'` entry, wherever it lives.
 *
 * @see https://github.com/scalar/scalar/issues/9854
 */
export const buildModelsIndex = (entries: TraversedEntry[]): Record<string, string> => {
  const index: Record<string, string> = {}

  const collect = (items: TraversedEntry[]): void => {
    for (const item of items) {
      if (item.type === 'model') {
        // Keep the first entry for a given name. A name can appear more than once when a schema is
        // listed under multiple tags, and the exact target does not matter as long as it scrolls
        // to that model.
        index[item.name] ??= item.id
      }

      if ('children' in item && item.children?.length) {
        collect(item.children)
      }
    }
  }

  collect(entries)

  return index
}
