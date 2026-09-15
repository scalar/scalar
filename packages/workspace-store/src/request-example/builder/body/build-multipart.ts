import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type {
  EncodingObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

import { resolveLeafSchema } from './schema-value-coercion'
import { serializeFormPropertyWithEncoding } from './serialize-form-property'

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

/** Whether a media type needs ordered or nested multipart serialization. */
export const needsMultipartEncoding = (contentType: string, media: MediaTypeObject): boolean => {
  const mime = parseMimeType(contentType)
  const schema = getResolvedRef(media.schema)
  return (
    mime.type === 'multipart' &&
    (mime.essence !== 'multipart/form-data' ||
      media.prefixEncoding !== undefined ||
      media.itemEncoding !== undefined ||
      (schema && 'type' in schema && schema.type === 'array') ||
      media.itemSchema !== undefined ||
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

/** Build ordered parts, applying prefix encodings independently of schema prefix lengths. */
export const buildMultipart = (
  value: unknown,
  contentType: string,
  encoding: Pick<MediaTypeObject, 'encoding' | 'prefixEncoding' | 'itemEncoding' | 'itemSchema'> = {},
  schema?: SchemaObject,
): MultipartPart[] => {
  const named = parseMimeType(contentType).essence === 'multipart/form-data'
  const positional = Array.isArray(value)
  const entries: [string | undefined, unknown, EncodingObject | undefined, SchemaObject | undefined][] = positional
    ? value.map((item, index) => {
        const itemEncoding =
          index < (encoding.prefixEncoding?.length ?? 0) ? encoding.prefixEncoding?.[index] : encoding.itemEncoding
        const itemSchema = getMultipartItemSchema(schema, index, encoding.itemSchema)
        if (named && item !== null && typeof item === 'object' && !Array.isArray(item)) {
          const entry = Object.entries(item)[0]
          return [entry?.[0], entry?.[1], itemEncoding, resolveLeafSchema(itemSchema, [entry?.[0] ?? ''])]
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
    const style =
      named &&
      (partEncoding?.style !== undefined ||
        partEncoding?.explode !== undefined ||
        partEncoding?.allowReserved !== undefined)
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
          value: buildMultipart(item, partContentType, partEncoding, partSchema),
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
          const fieldStyle =
            fieldEncoding?.style !== undefined ||
            fieldEncoding?.explode !== undefined ||
            fieldEncoding?.allowReserved !== undefined
          const subtype =
            !fieldStyle && fieldEncoding?.contentType ? parseMimeType(fieldEncoding.contentType).subtype : undefined
          const json = subtype === 'json' || subtype?.endsWith('+json')
          return [
            {
              key: name,
              value:
                json || (field !== null && typeof field === 'object')
                  ? JSON.stringify(unpackProxyObject(field))
                  : String(field ?? ''),
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
    const subtype = partContentType ? parseMimeType(partContentType).subtype : undefined
    const json = subtype === 'json' || subtype?.endsWith('+json')
    return [
      {
        ...metadata,
        type: 'text',
        value:
          json || (item !== null && typeof item === 'object')
            ? JSON.stringify(unpackProxyObject(item))
            : String(item ?? ''),
      },
    ]
  })
}
