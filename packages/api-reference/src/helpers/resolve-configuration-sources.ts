import { slugger } from '@scalar/helpers/string/slugger'
import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import {
  type AnyApiReferenceConfiguration,
  type ApiReferenceConfigurationRaw,
  type ApiReferenceConfigurationWithSource,
  isConfigurationWithSources,
} from '@scalar/types/api-reference'

/** A document given as a parsed object, or as the JSON or YAML text it was written in. */
export type DocumentContent = string | Record<string, unknown>

/**
 * A configuration with its title and slug worked out and its document source split off.
 *
 * `Content` is the shape of an inline document: still unparsed here, since parsing waits for the
 * document to load. See {@link parseDocumentContent}.
 */
export type ConfigurationWithSource<Content = DocumentContent> = {
  title: string
  slug: string
  config: ApiReferenceConfigurationRaw
  default: boolean
  agent: ApiReferenceConfigurationWithSource['agent']
  source: { url: string; content?: never } | { content: Content; url?: never }
}

type ConfigWithRequiredSource = Omit<ApiReferenceConfigurationWithSource, 'url' | 'content'> &
  ({ url: string; content?: never } | { content: Record<string, unknown>; url?: never })

const isConfigWithRequiredSource = (input: ApiReferenceConfigurationWithSource): input is ConfigWithRequiredSource => {
  return !!input.url?.trim() || !!input.content
}

/** Call a content function and return null for empty content, without parsing text. */
const resolveContent = (
  content: DocumentContent | (() => DocumentContent) | null | undefined,
): DocumentContent | null => {
  if (!content) {
    return null
  }

  if (typeof content === 'function') {
    return resolveContent(content())
  }

  return content
}

/**
 * Take any configuration and return a flat map of configurations by slug, with inline documents left
 * unparsed.
 *
 * Parsing waits for the document to load, so reading a configuration never needs the YAML parser.
 */
export const resolveConfigurationSources = (
  configuration: AnyApiReferenceConfiguration | undefined,
): Record<string, ConfigurationWithSource> => {
  const { slug } = slugger()

  const resolved: Record<string, ConfigurationWithSource> = {}

  if (!configuration) {
    return resolved
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
    .map<ApiReferenceConfigurationWithSource>((source) => apiReferenceConfigurationWithSourceSchema(source))
    /** Filter out configurations that failed validation or don't have a url or content */
    .filter(isConfigWithRequiredSource)
    /** Add required attributes to the source */
    .map((source, index) => addSlugAndTitle(source, index, slug))
    /** Separate the configuration and sources by slug */
    .forEach((c) => {
      const { url, content, ...config } = c
      resolved[c.slug] = {
        config,
        title: c.title,
        slug: c.slug,
        default: !!c?.default,
        agent: c.agent,
        source: content ? { content: resolveContent(content) ?? {} } : { url },
      }
    })

  return resolved
}

/**
 * Parse an inline document into an object, loading the YAML parser only when the text is not JSON.
 *
 * Behaves exactly like `parseJsonOrYaml`, which it hands anything but a JSON object to: most documents
 * are JSON, and those resolve here without the parser ever being fetched.
 */
export const parseDocumentContent = async (content: DocumentContent): Promise<Record<string, unknown> | null> => {
  if (typeof content !== 'string') {
    return content
  }

  try {
    const json: unknown = JSON.parse(content)
    if (json && typeof json === 'object') {
      return json as Record<string, unknown>
    }
  } catch {
    // Not JSON, so it is YAML or invalid; `parseJsonOrYaml` decides which below.
  }

  const { parseJsonOrYaml } = await import('@scalar/oas-utils/helpers')
  return parseJsonOrYaml(content)
}

/** Process a single spec configuration so that it has a title and a slug */
const addSlugAndTitle = (
  source: ConfigWithRequiredSource,
  index = 0,
  slug: (v: string) => string,
): ConfigWithRequiredSource & { slug: string; title: string } => {
  // Case 1: Title exists, generate slug from it
  if (source.title) {
    return {
      ...source,
      slug: source.slug || slug(source.title),
      title: source.title,
    }
  }

  // Case 2: Slug exists but no title, use slug as title
  if (source.slug) {
    return {
      ...source,
      slug: slug(source.slug),
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
