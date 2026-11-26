import type { SchemaNode } from '../types'

const common = new Set([
  'type',
  'schema',
  'displayName',
  'description',
  'default',
  'example',
  'examples',
  'enum',
  'required',
])
const specific: Record<string, readonly string[]> = {
  object: ['properties', 'minProperties', 'maxProperties', 'additionalProperties'],
  array: ['items', 'minItems', 'maxItems', 'uniqueItems'],
  string: ['pattern', 'minLength', 'maxLength'],
  number: ['minimum', 'maximum', 'multipleOf', 'format'],
  integer: ['minimum', 'maximum', 'multipleOf', 'format'],
  file: ['fileTypes', 'minLength', 'maxLength'],
  datetime: ['format'],
}

/** Infer only from facets unique to a built-in type, per RAML's default-type rules. */
export const inferType = (input: Record<string, unknown>): string => {
  const candidates = Object.entries(specific)
    .filter(([, facets]) =>
      facets.some(
        (facet) =>
          Object.hasOwn(input, facet) && Object.values(specific).filter((list) => list.includes(facet)).length === 1,
      ),
    )
    .map(([type]) => type)
  if (candidates.length > 1) {
    throw new Error('Conflicting RAML inferred types')
  }
  return candidates[0] ?? 'string'
}

/** Validate the facets we can faithfully document; unsupported semantics keep the source view. */
export const validateFacets = (input: Record<string, unknown>, node: SchemaNode, property: boolean): void => {
  const accepts = (node: SchemaNode, key: string): boolean =>
    node.type === 'union'
      ? !!node.children?.every((child) => accepts(child, key))
      : !!specific[node.type]?.includes(key)
  for (const [key, value] of Object.entries(input)) {
    if (!common.has(key) && !accepts(node, key)) {
      throw new Error('Unsupported RAML facet')
    }
    if (['description', 'displayName', 'pattern'].includes(key) && typeof value !== 'string') {
      throw new Error('Invalid RAML text facet')
    }
    if (['required', 'uniqueItems', 'additionalProperties'].includes(key) && typeof value !== 'boolean') {
      throw new Error('Invalid RAML boolean facet')
    }
    if (
      /^(min|max)(Length|Items|Properties)$/.test(key) &&
      (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    ) {
      throw new Error('Invalid RAML size facet')
    }
    if (
      ['minimum', 'maximum', 'multipleOf'].includes(key) &&
      (typeof value !== 'number' || !Number.isFinite(value) || (key === 'multipleOf' && value <= 0))
    ) {
      throw new Error('Invalid RAML numeric facet')
    }
    if (key === 'enum' && !Array.isArray(value)) {
      throw new Error('Invalid RAML enum')
    }
    if (key === 'fileTypes' && (!Array.isArray(value) || !value.every((type) => typeof type === 'string'))) {
      throw new Error('Invalid RAML file types')
    }
    if (key === 'format') {
      const validFormat = (node: SchemaNode): boolean =>
        node.type === 'union'
          ? !!node.children?.every(validFormat)
          : (node.type === 'datetime'
              ? ['rfc3339', 'rfc2616']
              : ['int', 'int8', 'int16', 'int32', 'int64', 'long', 'float', 'double']
            ).includes(String(value))
      if (!validFormat(node)) {
        throw new Error('Invalid RAML format')
      }
    }
  }
  if ('required' in input && !property) {
    throw new Error('RAML required is only valid on properties')
  }
  if ('example' in input && 'examples' in input) {
    throw new Error('Conflicting RAML example facets')
  }
  for (const [min, max] of [
    ['minimum', 'maximum'],
    ['minLength', 'maxLength'],
    ['minItems', 'maxItems'],
    ['minProperties', 'maxProperties'],
  ]) {
    if (min && max && typeof input[min] === 'number' && typeof input[max] === 'number' && input[min] > input[max]) {
      throw new Error('Conflicting RAML bounds')
    }
  }
}
