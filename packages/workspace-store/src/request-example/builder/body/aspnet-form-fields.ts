import { isObject } from '@scalar/helpers/object/is-object'
import type { MultipartNaming } from '@scalar/types/api-reference'

import { isFileSchema } from '@/helpers/is-file-schema'
import { resolveFormSchema } from '@/helpers/resolve-form-schema'
import { unpackProxyShallow } from '@/helpers/unpack-proxy'
import type { MediaTypeObject, SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@/schemas/v3.2/strict/schema'
import { isArraySchema, isObjectSchema } from '@/schemas/v3.2/strict/type-guards'

import { needsMultipartEncoding } from './build-multipart'
import { coerceLeafValueToSchemaType } from './schema-value-coercion'

/** ASP.NET Core binds named form fields. Ordered and nested MIME bodies use their own encodings. */
export const usesAspNetFormNaming = (
  contentType: string,
  media: MediaTypeObject | undefined,
  multipartNaming?: MultipartNaming,
): boolean =>
  multipartNaming === 'indexed-dot' &&
  (contentType === 'multipart/form-data' || contentType === 'application/x-www-form-urlencoded') &&
  media !== undefined &&
  !needsMultipartEncoding(contentType, media)

type FormField = {
  name: string
  /** Encoding entries use the original property name, before indexed-dot flattening. */
  rootName: string
  value: unknown
  schema: SchemaObject | undefined
  isRequired: boolean
  isDisabled: boolean
  isDisabledByDefault?: boolean
  isArray?: boolean
}

const getProperty = (schema: SchemaObject | undefined, name: string): MaybeRefSchemaObject | undefined =>
  schema && 'properties' in schema && schema.properties && Object.hasOwn(schema.properties, name)
    ? schema.properties[name]
    : undefined

const getItem = (schema: SchemaObject | undefined, index: number): MaybeRefSchemaObject | undefined => {
  if (!schema || !isArraySchema(schema)) {
    return undefined
  }
  const item = schema.prefixItems?.[index] ?? schema.items
  return typeof item === 'object' ? item : undefined
}

const isRequiredProperty = (schema: SchemaObject | undefined, key: string): boolean =>
  Boolean(schema && 'required' in schema && schema.required?.includes(key))

const resolveField = (
  schema: SchemaObject | undefined,
  name: string,
  compositionSelection?: Record<string, number>,
): { schema: SchemaObject | undefined; isRequired: boolean; rootName: string } => {
  const segments = getProperty(schema, name) === undefined ? name.split(/\.|\[(\d+)\]/).filter(Boolean) : [name]
  let current = schema
  let isRequired = segments.length > 0
  const path = ['requestBody']
  for (const segment of segments) {
    if (current && isArraySchema(current) && /^\d+$/.test(segment)) {
      path.push('items')
      current = resolveFormSchema(getItem(current, Number(segment)), compositionSelection, path)
    } else {
      path.push(segment)
      isRequired = isRequired && isRequiredProperty(current, segment)
      current = resolveFormSchema(getProperty(current, segment), compositionSelection, path)
    }
  }
  return { schema: current, isRequired, rootName: segments[0] ?? name }
}

/** Map a structured example or saved editor rows to the field names understood by ASP.NET Core. */
export const getAspNetFormFields = (
  value: unknown,
  schema: SchemaObject | undefined,
  compositionSelection?: Record<string, number>,
  includeMissing = false,
): FormField[] => {
  const fields: FormField[] = []
  const ancestors = new Set<object>()

  const visit = (field: FormField, inputSchema: MaybeRefSchemaObject | undefined, schemaPath: string[]): void => {
    const { name, value, schema } = field
    // Schema placeholders can reach recursive references even when the example is finite.
    const missingValueSchema = value === undefined ? inputSchema : undefined
    const source = isObject(value) || Array.isArray(value) ? value : missingValueSchema
    const identity = source && unpackProxyShallow(source)
    if (identity && ancestors.has(identity)) {
      return
    }
    if (identity) {
      ancestors.add(identity)
    }
    try {
      if (Array.isArray(value) || (includeMissing && value === undefined)) {
        const entries: unknown[] = Array.isArray(value) ? value : []
        const itemPath = [...schemaPath, 'items']
        const item = resolveFormSchema(getItem(schema, 0), compositionSelection, itemPath)
        if (
          entries.some((entry) => isObject(entry) || Array.isArray(entry)) ||
          (item && (isObjectSchema(item) || isArraySchema(item)))
        ) {
          const canAddItem = schema && isArraySchema(schema) && schema.maxItems !== 0
          const items = entries.length || !includeMissing || !canAddItem ? entries : [undefined]
          items.forEach((entry, index) => {
            const itemInput = getItem(schema, index)
            visit(
              {
                ...field,
                name: `${name}[${index}]`,
                value: entry,
                schema: resolveFormSchema(itemInput, compositionSelection, itemPath),
                isArray: undefined,
              },
              itemInput,
              itemPath,
            )
          })
          return
        }
      }

      const data = isObject(value) ? value : undefined
      const properties = schema && 'properties' in schema ? schema.properties : undefined
      if (data || (includeMissing && value === undefined && properties)) {
        const names = new Set([...Object.keys(properties ?? {}), ...Object.keys(data ?? {})])
        for (const key of names) {
          const childInput = getProperty(schema, key)
          const path = [...schemaPath, key]
          const childSchema = resolveFormSchema(childInput, compositionSelection, path)
          const childValue = data && Object.hasOwn(data, key) ? data[key] : undefined
          if (childValue === undefined && (!includeMissing || childSchema?.readOnly)) {
            continue
          }
          const isRequired = isRequiredProperty(schema, key)
          const optionalRoot =
            !name && childInput !== undefined && !isRequired && !schema?.allOf && !schema?.oneOf && !schema?.anyOf
          visit(
            {
              name: name ? `${name}.${key}` : key,
              rootName: name ? field.rootName : key,
              value: childValue,
              schema: childSchema,
              isRequired: field.isRequired && isRequired,
              isDisabled: field.isDisabled || optionalRoot,
              isDisabledByDefault: field.isDisabledByDefault || optionalRoot || undefined,
            },
            childInput,
            path,
          )
        }
        return
      }

      if (name) {
        fields.push(field)
      }
    } finally {
      if (identity) {
        ancestors.delete(identity)
      }
    }
  }

  if (Array.isArray(value)) {
    for (const row of value) {
      if (!isObject(row) || typeof row.name !== 'string') {
        continue
      }
      const field = resolveField(schema, row.name, compositionSelection)
      // Older form rows store structured values as JSON text. Keep scalar input verbatim.
      const restored = coerceLeafValueToSchemaType(row.value, row.isArray === true ? { type: 'array' } : field.schema)
      visit(
        {
          name: row.name,
          value: Array.isArray(restored) || isObject(restored) ? restored : row.value,
          ...field,
          isDisabled: row.isDisabled === true,
          isDisabledByDefault: row.isDisabledByDefault === true || undefined,
          isArray: row.isArray === true || undefined,
        },
        field.schema,
        ['requestBody', row.name],
      )
    }
  } else {
    visit({ name: '', rootName: '', value, schema, isRequired: true, isDisabled: false }, schema, ['requestBody'])
  }
  return fields
}

/** Add explicit indices for sparse collections so MVC binds items beyond the first gap. */
export const getAspNetFormIndexFields = (names: string[]): { key: string; value: string }[] => {
  const explicitNames = new Set(names.map((name) => name.toLowerCase()))
  const collections = new Map<string, { key: string; indices: Set<string> }>()
  for (const name of names) {
    for (const match of name.matchAll(/\[(\d+)\](?=\.|\[|$)/g)) {
      const index = match[1]
      if (index === undefined || match.index === 0) {
        continue
      }
      const key = `${name.slice(0, match.index)}.index`
      const normalized = key.toLowerCase()
      if (explicitNames.has(normalized)) {
        continue
      }
      const collection = collections.get(normalized) ?? { key, indices: new Set<string>() }
      collection.indices.add(index)
      collections.set(normalized, collection)
    }
  }
  return [...collections.values()].flatMap(({ key, indices }) => {
    const values = [...indices]
    return values.every((_, index) => indices.has(String(index))) ? [] : values.map((value) => ({ key, value }))
  })
}

/** Include file upload examples when generating snippets for schema-backed multipart fields. */
export const withAspNetMultipartFilePlaceholder = (
  field: FormField,
  includeMissing: boolean,
  contentType?: string,
): FormField => {
  if (!field.schema || !isFileSchema(field.schema, false, contentType)) {
    return field
  }
  const toFile = (value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith('@') && value.length > 1) {
      return new File([], value.slice(1), { lastModified: 0 })
    }
    if (includeMissing && (value === undefined || value === null || value === '')) {
      return new File([], 'filename', { lastModified: 0 })
    }
    return value
  }
  return { ...field, value: Array.isArray(field.value) ? field.value.map(toFile) : toFile(field.value) }
}
