import { readAvro } from './avro/avro'
import { readProtobuf } from './protobuf/protobuf'
import { readRaml } from './raml/raml'
import type { SchemaDocument } from './types'

/** Dispatch by declared language and version, keeping failures on the existing source path. */
export const readSchema = (format: string, value: unknown): SchemaDocument | undefined => {
  if (typeof value === 'string' && value.length > 200_000) {
    return undefined
  }
  const [mediaType, ...parameters] = format
    .toLowerCase()
    .split(';')
    .map((part) => part.trim())
  const versions = parameters
    .map((part) => /^version\s*=\s*"?([^"\s]+)"?$/.exec(part)?.[1])
    .filter((value) => value !== undefined)
  if (versions.length !== 1 || parameters.length !== 1) {
    return undefined
  }
  const version = versions[0]!
  try {
    if (
      /^application\/vnd\.apache\.avro(?:\+json|\+yaml)?$/.test(mediaType ?? '') &&
      ['1.8.2', '1.9.0'].includes(version)
    ) {
      return readAvro(value, version, mediaType?.endsWith('+yaml') ? 'yaml' : 'json')
    }
    if (mediaType === 'application/raml+yaml' && version === '1.0') {
      return readRaml(value)
    }
    if (mediaType === 'application/vnd.google.protobuf' && ['2', '3'].includes(version)) {
      return readProtobuf(value, version)
    }
  } catch {
    // Partial or misleading documentation is worse than the original readable schema.
    return undefined
  }
  return undefined
}
