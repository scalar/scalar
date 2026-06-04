import { AVAILABLE_CLIENTS, type AvailableClients, snippetz } from '@scalar/snippetz'
import type { XCodeSample } from '@scalar/workspace-store/schemas/extensions/operation'
import { capitalize } from 'vue'

import type { ClientOptionGroup } from '@/v2/blocks/operation-code-sample/types'

/** Type of custom code sample IDs */
export type CustomCodeSampleId = `custom/${string}`

/**
 * Build stable, language-keyed ids for an operation's custom code samples.
 *
 * Custom samples are defined per operation, but a selection (e.g. the Python SDK
 * example) should sync across every operation that ships the same language. So we
 * key the id by language rather than by position: the first sample of a language
 * becomes `custom/<lang>`, and any further samples that repeat a language fall back
 * to `custom/<lang>/<n>` so they stay individually selectable within the operation.
 *
 * The language is lower-cased so a selection still matches when operations (or
 * extensions) spell the same language with different casing (e.g. `Python` vs
 * `python`).
 *
 * @param samples - The custom code samples for a single operation
 * @returns A list of ids aligned by index with the input samples
 */
export const getCustomClientIds = (samples: XCodeSample[]): CustomCodeSampleId[] => {
  const countByLang = new Map<string, number>()

  return samples.map((sample): CustomCodeSampleId => {
    const lang = (sample.lang || 'plaintext').toLowerCase()
    const seen = countByLang.get(lang) ?? 0
    countByLang.set(lang, seen + 1)

    return seen === 0 ? `custom/${lang}` : `custom/${lang}/${seen}`
  })
}

/**
 * Generate client options for the request example block by filtering by allowed clients
 *
 * @param allowedClients - The list of allowed clients to include in the options
 * @returns A list of client option groups
 */
export const generateClientOptions = (allowedClients: AvailableClients = AVAILABLE_CLIENTS): ClientOptionGroup[] => {
  /** Create set of allowlist for quicker lookups */
  const allowedClientsSet = new Set(allowedClients)

  const options = snippetz()
    .clients()
    .flatMap((group) => {
      const options = group.clients.flatMap((plugin) => {
        const id = `${group.key}/${plugin.client}` as AvailableClients[number]

        // If the client is not allowed, skip it
        if (!allowedClientsSet.has(id)) {
          return []
        }

        return {
          id,
          lang: plugin.client === 'curl' ? ('curl' as const) : group.key,
          title: `${capitalize(group.title)} ${plugin.title}`,
          label: plugin.title,
          targetKey: group.key,
          targetTitle: group.title,
          clientKey: plugin.client,
        }
      })

      // If no clients are allowed, skip this group
      if (options.length === 0) {
        return []
      }

      return {
        label: group.title,
        key: group.key,
        options,
      }
    })

  return options
}
