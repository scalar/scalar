import { json2xml } from '@scalar/helpers/file/json2xml'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type {
  EncodingObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import { MAX_MULTIPART_NESTING } from './multipart-limits'
import { resolveLeafSchema } from './schema-value-coercion'
import { hasEncodingStyle, serializeFormPropertyWithEncoding } from './serialize-form-property'

/** Multipart parts stay structured until sending so nested text can resolve environment variables. */
export type MultipartPart = {
  key?: string
  contentType?: string
  headers?: Record<string, string>
} & (
  | { type: 'text'; value: string }
  | { type: 'file'; value: File }
  | { type: 'blob'; value: Blob }
  | { type: 'multipart'; value: MultipartPart[]; contentType: string }
)

/** Identify ordered multipart independently of the editor's row representation. */
export const isPositionalMultipart = (contentType: string, media: MediaTypeObject): boolean => {
  const schema = getResolvedRef(media.schema)
  return (
    parseMimeType(contentType).essence !== 'multipart/form-data' ||
    media.prefixEncoding !== undefined ||
    media.itemEncoding !== undefined ||
    (schema !== undefined && isArraySchema(schema)) ||
    media.itemSchema !== undefined
  )
}

/** Whether a media type needs ordered or nested multipart serialization. */
export const needsMultipartEncoding = (contentType: string, media: MediaTypeObject): boolean => {
  const mime = parseMimeType(contentType)
  return (
    mime.type === 'multipart' &&
    (isPositionalMultipart(contentType, media) ||
      Object.values(media.encoding ?? {}).some(
        (encoding) => parseMimeType(encoding.contentType).type === 'multipart' || encoding.encoding !== undefined,
      ))
  )
}

const defaultContentType = (schema: SchemaObject | undefined, value: unknown): string => {
  if (value instanceof Blob) {
    return value.type || 'application/octet-stream'
  }
  if (schema && (!('type' in schema) || !schema.type || (schema.type === 'string' && schema.contentEncoding))) {
    return 'application/octet-stream'
  }
  return typeof value === 'object' && value !== null ? 'application/json' : 'text/plain'
}

/** Encoding accepts ranges, but each wire header needs a single concrete media type. */
const selectContentType = (encoding: string | undefined, schema: SchemaObject | undefined, value: unknown): string => {
  const fallback = defaultContentType(schema, value)
  if (!encoding) {
    return fallback
  }
  if (/[\r\n\0]/.test(encoding)) {
    throw new Error('Invalid multipart content type')
  }
  const choices = encoding.split(',').map((choice) => choice.trim())
  const preferred = parseMimeType(fallback)
  const match = choices.find((choice) => {
    const mime = parseMimeType(choice)
    return (
      (mime.type === '*' || mime.type === preferred.type) &&
      (mime.subtype === '*' || mime.subtype === preferred.subtype)
    )
  })
  if (match) {
    const mime = parseMimeType(match)
    if (!mime.essence.includes('*')) {
      return match
    }
    // Keep parameters from the range while replacing only its wildcard essence.
    return match.replace(/^[^;]+/, preferred.essence)
  }
  return choices.find((choice) => !parseMimeType(choice).essence.includes('*')) ?? fallback
}

/** Resolve a positional item's schema independently of the encoding prefix length. */
export const getMultipartItemSchema = (
  schema: SchemaObject | undefined,
  index: number,
  itemSchema?: MediaTypeObject['itemSchema'],
): SchemaObject | undefined =>
  getResolvedRef(
    (schema && 'prefixItems' in schema ? schema.prefixItems?.[index] : undefined) ??
      (schema && 'items' in schema ? schema.items : undefined) ??
      itemSchema,
    mergeSiblingReferences,
  ) as SchemaObject | undefined

/** Serialize structured values to the selected part format; strings already containing XML stay intact. */
const serializePartValue = (value: unknown, contentType?: string, schema?: SchemaObject): string => {
  const subtype = contentType ? parseMimeType(contentType).subtype : undefined
  if ((subtype === 'xml' || subtype?.endsWith('+xml')) && isObject(value)) {
    // Match the XML generator's fallback without changing the root when properties are added.
    const rootName = schema?.xml?.name ?? 'root'
    return json2xml({ [rootName]: unpackProxyObject(value) })
  }
  const json = subtype === 'json' || subtype?.endsWith('+json')
  return json || (value !== null && typeof value === 'object')
    ? JSON.stringify(unpackProxyObject(value))
    : String(value ?? '')
}

/** Build ordered parts, applying prefix encodings independently of schema prefix lengths. */
export const buildMultipart = (
  value: unknown,
  contentType: string,
  encoding: Pick<MediaTypeObject, 'encoding' | 'prefixEncoding' | 'itemEncoding' | 'itemSchema'> = {},
  schema?: SchemaObject,
  nesting = 0,
): MultipartPart[] => {
  if (nesting >= MAX_MULTIPART_NESTING) {
    throw new Error('Maximum multipart nesting exceeded')
  }
  const named = parseMimeType(contentType).essence === 'multipart/form-data'
  const positional = Array.isArray(value)
  const entries: [string | undefined, unknown, EncodingObject | undefined, SchemaObject | undefined][] = positional
    ? value.map((item, index) => {
        const itemEncoding =
          index < (encoding.prefixEncoding?.length ?? 0) ? encoding.prefixEncoding?.[index] : encoding.itemEncoding
        const itemSchema = getMultipartItemSchema(schema, index, encoding.itemSchema)
        if (named && item !== null && typeof item === 'object' && !Array.isArray(item)) {
          // Each position describes one named part; accepting more keys would silently discard data.
          const entries = Object.entries(item)
          const entry = entries[0]
          if (entries.length !== 1 || !entry) {
            throw new Error('Named positional multipart items must contain exactly one property')
          }
          return [entry[0], entry[1], itemEncoding, resolveLeafSchema(itemSchema, [entry[0]])]
        }
        return [undefined, item, itemEncoding, itemSchema]
      })
    : value !== null && typeof value === 'object'
      ? Object.entries(value).flatMap(([key, item]) => {
          const propertySchema = resolveLeafSchema(schema, [key])
          return (Array.isArray(item) ? item : [item]).map((part): (typeof entries)[number] => [
            key,
            part,
            encoding.encoding?.[key],
            Array.isArray(item)
              ? (getResolvedRef(
                  propertySchema && isArraySchema(propertySchema) ? propertySchema.items : undefined,
                  mergeSiblingReferences,
                ) as SchemaObject | undefined)
              : propertySchema,
          ])
        })
      : []

  return entries.flatMap(([key, item, partEncoding, partSchema]): MultipartPart[] => {
    const style = named && hasEncodingStyle(partEncoding)
    const styleParts = style ? serializeFormPropertyWithEncoding(key ?? '', item, partEncoding) : null
    const partContentType = style ? undefined : selectContentType(partEncoding?.contentType, partSchema, item)
    const headers = Object.fromEntries(
      Object.entries(partEncoding?.headers ?? {}).flatMap(([name, ref]) => {
        if (name.toLowerCase() === 'content-type') {
          return []
        }
        const header = getResolvedRef(ref)
        if (!header || !('schema' in header)) {
          return []
        }
        const headerSchema = getResolvedRef(header.schema)
        const example =
          header?.example ??
          getResolvedRef(Object.values(header?.examples ?? {})[0])?.value ??
          headerSchema?.const ??
          headerSchema?.default
        return example === undefined ? [] : [[name, String(example)]]
      }),
    )
    if (
      partSchema?.contentEncoding &&
      !Object.keys(headers).some((name) => name.toLowerCase() === 'content-transfer-encoding')
    ) {
      headers['Content-Transfer-Encoding'] = partSchema.contentEncoding
    }
    const metadata = {
      ...(key === undefined ? {} : { key }),
      ...(partContentType ? { contentType: partContentType } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
    }
    if (styleParts) {
      return styleParts.map((part) => ({ ...metadata, type: 'text', ...part }))
    }
    if (
      partContentType &&
      parseMimeType(partContentType).type === 'multipart' &&
      typeof item !== 'string' &&
      !(item instanceof Blob)
    ) {
      return [
        {
          ...metadata,
          type: 'multipart',
          contentType: partContentType,
          value: buildMultipart(item, partContentType, partEncoding, partSchema, nesting + 1),
        },
      ]
    }
    if (
      partContentType &&
      parseMimeType(partContentType).essence === 'application/x-www-form-urlencoded' &&
      item !== null &&
      typeof item === 'object'
    ) {
      const params = Object.entries(item).flatMap(([name, fieldValue]) =>
        (Array.isArray(fieldValue) ? fieldValue : [fieldValue]).flatMap((field) => {
          const fieldEncoding = partEncoding?.encoding?.[name]
          const styled = serializeFormPropertyWithEncoding(name, field, fieldEncoding)
          if (styled) {
            return styled
          }
          return [
            {
              key: name,
              value: serializePartValue(
                field,
                hasEncodingStyle(fieldEncoding) ? undefined : fieldEncoding?.contentType,
              ),
            },
          ]
        }),
      )
      return [
        {
          ...metadata,
          type: 'text',
          value: new URLSearchParams(params.map((part) => [part.key, part.value])).toString(),
        },
      ]
    }
    if (item instanceof File) {
      return [{ ...metadata, type: 'file', value: unpackProxyObject(item) }]
    }
    if (item instanceof Blob) {
      return [{ ...metadata, type: 'blob', value: unpackProxyObject(item) }]
    }
    return [{ ...metadata, type: 'text', value: serializePartValue(item, partContentType, partSchema) }]
  })
}
