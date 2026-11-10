import { parseDocument } from 'yaml'

const primitiveNames = new Set(['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'])

/** Avro wrappers can carry an already parsed schema or source text in their declared encoding. */
export const parseSource = (source: unknown, encoding: 'json' | 'yaml'): unknown => {
  if (typeof source !== 'string' || primitiveNames.has(source)) {
    return source
  }
  if (source.length > 200_000) {
    throw new Error('Avro source is too large')
  }
  if (encoding === 'json') {
    return JSON.parse(source) as unknown
  }
  const document = parseDocument(source)
  if (document.errors.length || document.warnings.length) {
    throw new Error('Invalid Avro YAML')
  }
  return document.toJS({ maxAliasCount: 50 })
}
