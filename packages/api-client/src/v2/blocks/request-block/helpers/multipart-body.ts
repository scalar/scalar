import { parseMimeType } from '@scalar/helpers/http/mime-type'
import { isObject } from '@scalar/helpers/object/is-object'
import { getExampleValue } from '@scalar/workspace-store/helpers/get-example-value'
import { isFileSchema } from '@scalar/workspace-store/helpers/is-file-schema'
import { resolveFormSchema } from '@scalar/workspace-store/helpers/resolve-form-schema'
import { unpackProxyShallow } from '@scalar/workspace-store/helpers/unpack-proxy'
import { MAX_MULTIPART_NESTING, getMultipartItemSchema } from '@scalar/workspace-store/request-example'
import type {
  EncodingObject,
  ExampleObject,
  MediaTypeObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { isArraySchema } from '@scalar/workspace-store/schemas/v3.2/strict/type-guards'

/** Keep structured parts and File objects intact until the existing multipart serializer runs. */
export type MultipartBodyValue = unknown[] | Record<string, unknown>

/** One editable leaf part; paths retain positions and literal property names. */
export type MultipartBodyPart = {
  path: (string | number)[]
  value: unknown
  schema?: SchemaObject
  contentType?: string
  canUpload: boolean
}

/** Raw wire examples stay in the raw editor, while JSON arrays/objects can expose individual parts. */
export const parseMultipartBody = (example: ExampleObject | null | undefined): MultipartBodyValue | undefined => {
  const selected = getExampleValue(example ?? undefined)
  if (!selected || selected.source === 'serialized') {
    return undefined
  }
  try {
    const value: unknown =
      typeof selected.value === 'string' ? JSON.parse(selected.value) : unpackProxyShallow(selected.value)
    return Array.isArray(value) || isObject(value) ? value : undefined
  } catch {
    return undefined
  }
}

/** Match the serializer's positional and named layouts without flattening JSON parts into form fields. */
export const getMultipartBodyParts = (
  value: MultipartBodyValue,
  media: MediaTypeObject,
  compositionSelection?: Record<string, number>,
): MultipartBodyPart[] => {
  const walk = (
    body: MultipartBodyValue,
    encoding: Pick<MediaTypeObject, 'encoding' | 'prefixEncoding' | 'itemEncoding' | 'itemSchema'>,
    schema: SchemaObject | undefined,
    path: (string | number)[],
    schemaPath: string[],
    nesting = 0,
  ): MultipartBodyPart[] => {
    const part = (
      partValue: unknown,
      rawSchema: SchemaObject | undefined,
      partEncoding: EncodingObject | undefined,
      partPath: (string | number)[],
      partSchemaPath: string[],
    ): MultipartBodyPart[] => {
      const partSchema = resolveFormSchema(rawSchema, compositionSelection, partSchemaPath)
      if (
        nesting + 1 < MAX_MULTIPART_NESTING &&
        parseMimeType(partEncoding?.contentType).type === 'multipart' &&
        (Array.isArray(partValue) || isObject(partValue))
      ) {
        return walk(partValue, partEncoding ?? {}, partSchema, partPath, partSchemaPath, nesting + 1)
      }
      return [
        {
          path: partPath,
          value: unpackProxyShallow(partValue),
          schema: partSchema,
          contentType: partEncoding?.contentType,
          canUpload:
            partSchema === undefined ||
            (!isArraySchema(partSchema) && isFileSchema(partSchema, true, partEncoding?.contentType)),
        },
      ]
    }
    if (Array.isArray(body)) {
      const items =
        body.length === 0 && path.length > 0 && !(schema && 'maxItems' in schema && schema.maxItems === 0) ? [''] : body
      return items.flatMap((item, index) =>
        part(
          item,
          getMultipartItemSchema(schema, index, encoding.itemSchema),
          index < (encoding.prefixEncoding?.length ?? 0) ? encoding.prefixEncoding?.[index] : encoding.itemEncoding,
          [...path, index],
          schema && 'prefixItems' in schema && schema.prefixItems?.[index]
            ? [...schemaPath, 'prefixItems', String(index)]
            : [...schemaPath, 'items'],
        ),
      )
    }
    return Object.entries(body).flatMap(([name, item]) => {
      const properties = schema && 'properties' in schema ? schema.properties : undefined
      const additional = schema && 'additionalProperties' in schema ? schema.additionalProperties : undefined
      const propertySchema = resolveFormSchema(
        properties?.[name] ?? (typeof additional === 'object' ? additional : undefined),
        compositionSelection,
        [...schemaPath, name],
      )
      return Array.isArray(item)
        ? (item.length || (propertySchema && 'maxItems' in propertySchema && propertySchema.maxItems === 0)
            ? item
            : ['']
          ).flatMap((entry, index) =>
            part(
              entry,
              getMultipartItemSchema(propertySchema, index),
              encoding.encoding?.[name],
              [...path, name, index],
              propertySchema && 'prefixItems' in propertySchema && propertySchema.prefixItems?.[index]
                ? [...schemaPath, name, 'prefixItems', String(index)]
                : [...schemaPath, name, 'items'],
            ),
          )
        : part(item, propertySchema, encoding.encoding?.[name], [...path, name], [...schemaPath, name])
    })
  }
  return walk(value, media, resolveFormSchema(media.schema, compositionSelection), [], ['requestBody'])
}

/** Copy only the edited path so uploading a file never serializes sibling File objects or mutates the example. */
export const updateMultipartBodyPart = (
  body: MultipartBodyValue,
  path: (string | number)[],
  value: unknown,
): MultipartBodyValue => {
  const update = (current: unknown, remaining: (string | number)[]): unknown => {
    const [key, ...rest] = remaining
    if (key === undefined) {
      return value
    }
    if (Array.isArray(current) && typeof key === 'number') {
      return key === current.length
        ? [...current, update(undefined, rest)]
        : current.map((item, index) => (index === key ? update(item, rest) : item))
    }
    if (isObject(current) && Object.hasOwn(current, key)) {
      return { ...current, [key]: update(current[key], rest) }
    }
    return current
  }
  const result = update(body, path)
  return Array.isArray(result) || isObject(result) ? result : body
}
