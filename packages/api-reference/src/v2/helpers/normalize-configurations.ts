import { parseJsonOrYaml } from '@scalar/oas-utils/helpers'
import {
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfigurationRaw,
  type ApiReferenceConfigurationWithSource,
  apiReferenceConfigurationWithSourceSchema,
  isConfigurationWithSources,
} from '@scalar/types'
import GithubSlugger from 'github-slugger'

const slugger = new GithubSlugger()

type NormalizedConfigurations = Record<
  string,
  {
    slug: string
    config: ApiReferenceConfigurationRaw
    default: boolean
    source: { url: string } | { content: Record<string, unknown> }
  }
>

type ConfigWithRequiredSource = Omit<ApiReferenceConfigurationWithSource, 'url' | 'content'> &
  ({ url: string; content?: never } | { content: Record<string, unknown>; url?: never })

/**
 * Take any configuration and return a flat array of configurations.
 */
export const normalizeConfigurations = (
  configuration: AnyApiReferenceConfiguration | undefined,
): NormalizedConfigurations => {
  const normalized: NormalizedConfigurations = {}

  if (!configuration) {
    return normalized
  }

  const configList = Array.isArray(configuration) ? configuration : [configuration]

  configList
    /** Create a flat array of configurations with their document source data integrated. */
    .flatMap((c) => {
      // Check if this config has a 'sources' array property
      if (isConfigurationWithSources(c)) {
        // Destructure to separate sources array from other config properties
        const { sources: configSources, ...rest } = c

        // For each source in the array:
        // - Merge the source with the parent config properties
        // - Handle undefined sources by returning empty array via ?? []
        return configSources?.map((source) => ({ ...rest, ...source })) ?? []
      }

      // If config doesn't have sources array, treat the config itself as a source
      return [c]
    })
    .map((source) => {
      /** Validation with migrate deprecated attributes to their new format */
      const validated = apiReferenceConfigurationWithSourceSchema.safeParse(source)
      return validated.success ? validated.data : null
    })
    /** Filter out configurations that failed validation or don't have a url or content */
    .filter((c): c is ConfigWithRequiredSource => !!c && (!!c.url || !!c.content))
    /** Add required attributes to the source */
    .map((source, index) => addSlugAndTitle(source, index))
    /** Separate the configuration and sources by slug */
    .forEach((c) => {
      const { url, content, ...config } = c
      normalized[c.slug] = {
        config,
        slug: c.slug,
        default: !!c?.default,
        source: content ? { content: normalizeContent(content) } : { url },
      }
    })

  // Process them and return normalized
  return normalized
}

/** Normalize content into a JS object or return null if it is falsey */
export const normalizeContent = (
  content: string | Record<string, unknown> | (() => string | Record<string, unknown>),
): Record<string, unknown> => {
  if (typeof content === 'function') {
    return normalizeContent(content())
  }

  if (typeof content === 'string') {
    return parseJsonOrYaml(content)
  }

  return content
}

/** Process a single spec configuration so that it has a title and a slug */
export const addSlugAndTitle = (
  source: ConfigWithRequiredSource,
  index = 0,
): ConfigWithRequiredSource & { slug: string; title: string } => {
  // Reset slugger to avoid duplicate handling
  slugger.reset()

  // Case 1: Title exists, generate slug from it
  if (source.title) {
    return {
      ...source,
      slug: source.slug || slugger.slug(source.title),
      title: source.title,
    }
  }

  // Case 2: Slug exists but no title, use slug as title
  if (source.slug) {
    return {
      ...source,
      slug: slugger.slug(source.slug),
      title: source.slug,
    }
  }

  // Case 3: Neither exists, use index
  return {
    ...source,
    slug: `api-${index + 1}`,
    title: `API #${index + 1}`,
  }
}
