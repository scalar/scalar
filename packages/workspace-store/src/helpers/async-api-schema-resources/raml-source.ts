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
