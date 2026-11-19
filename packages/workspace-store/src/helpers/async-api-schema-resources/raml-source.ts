import { YAML_MAX_ALIAS_COUNT } from '@scalar/helpers/general/yaml-max-alias-count'
import { parseDocument } from 'yaml'

/** A tagged include stays distinct from authored objects and ordinary scalar strings. */
export class RamlInclude {
  constructor(readonly path: string) {}
}

/** Parse RAML while retaining include tags for location-aware resolution. */
export const parseRamlSource = (source: string): unknown => {
  const document = parseDocument(source, {
    customTags: [{ tag: '!include', resolve: (path: string): RamlInclude => new RamlInclude(path) }],
  })
  if (document.errors.length || document.warnings.length) throw new Error('Invalid RAML YAML')
  return document.toJS({ maxAliasCount: YAML_MAX_ALIAS_COUNT })
}

/** The RAML grammar position controls whether an include contains schemas, text, or literal data. */
export type RamlPosition = 'schema' | 'properties' | 'text' | 'data' | 'library'

/** Keep dependency discovery and include expansion on the same child-position rules. */
export const ramlChildPosition = (position: RamlPosition, key: string): RamlPosition => {
  if (position === 'properties') return 'schema'
  if (position === 'data' || position === 'text') return 'data'
  if (key === 'properties' || (position === 'library' && key === 'types')) return 'properties'
  if (['description', 'displayName', 'usage'].includes(key)) return 'text'
  if (['example', 'examples', 'default', 'enum'].includes(key)) return 'data'
  return 'schema'
}
