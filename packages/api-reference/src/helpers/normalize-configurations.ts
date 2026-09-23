import { parseJsonOrYaml } from '@scalar/oas-utils/helpers'
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

import {
  type ConfigurationWithSource,
  type DocumentContent,
  resolveConfigurationSources,
} from '@/helpers/resolve-configuration-sources'

/** Processed API Reference Configuration
 *
 * Creates the required title and slug for the API Reference.
 * Separate the source into a dedicated object
 * Returns the raw configuration to pass to components
 */
export type NormalizedConfiguration = ConfigurationWithSource<Record<string, unknown>>

type NormalizedConfigurations = Record<string, NormalizedConfiguration>

/**
 * Take any configuration and return a flat array of configurations, with inline documents parsed.
 *
 * This parses synchronously, so it keeps the YAML parser as a static dependency. The API reference
 * itself uses `resolveConfigurationSources` and parses documents as they load instead.
 */
export const normalizeConfigurations = (
  configuration: AnyApiReferenceConfiguration | undefined,
): NormalizedConfigurations =>
  Object.fromEntries(
    Object.entries(resolveConfigurationSources(configuration)).map(([slug, resolved]) => [
      slug,
      resolved.source.url !== undefined
        ? { ...resolved, source: { url: resolved.source.url } }
        : { ...resolved, source: { content: normalizeContent(resolved.source.content) ?? {} } },
    ]),
  )

/** Normalize content into a JS object or return null if it is falsey */
export const normalizeContent = (
  content: DocumentContent | (() => DocumentContent),
): Record<string, unknown> | null => {
  if (!content) {
    return null
  }

  if (typeof content === 'function') {
    return normalizeContent(content())
  }

  if (typeof content === 'string') {
    return parseJsonOrYaml(content)
  }

  return content
}
