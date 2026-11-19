import { isObject } from '@scalar/helpers/object/is-object'

import { resolveFormSchema } from '@/helpers/resolve-form-schema'
import { unpackProxyShallow } from '@/helpers/unpack-proxy'
import type { MediaTypeObject, SchemaObject } from '@/schemas/v3.2/strict/openapi-document'
import type { MaybeRefSchemaObject } from '@/schemas/v3.2/strict/schema'
import { isArraySchema, isObjectSchema } from '@/schemas/v3.2/strict/type-guards'

import { needsMultipartEncoding } from './build-multipart'
import { coerceLeafValueToSchemaType } from './schema-value-coercion'

/** ASP.NET Core binds named form fields. Ordered and nested MIME bodies use their own encodings. */
export const usesAspNetMultipartNaming = (contentType: string, media: MediaTypeObject | undefined): boolean =>
  contentType === 'multipart/form-data' &&
  media?.['x-scalar-multipart-naming'] === 'aspnet-core' &&
  !needsMultipartEncoding(contentType, media)

type FormField = {
  name: string
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

const getItem = (schema: SchemaObject | undefined, index?: number): MaybeRefSchemaObject | undefined => {
  if (!schema || !isArraySchema(schema)) {
    return undefined
  }
  const item = (index === undefined ? undefined : schema.prefixItems?.[index]) ?? schema.items
  return typeof item === 'object' ? item : undefined
}

const isRequiredProperty = (schema: SchemaObject | undefined, key: string): boolean =>
  Boolean(schema && 'required' in schema && schema.required?.includes(key))

const resolveField = (
  schema: SchemaObject | undefined,
  name: string,
  compositionSelection?: Record<string, number>,
): { schema: SchemaObject | undefined; isRequired: boolean } => {
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
  return { schema: current, isRequired }
}

/** Find the schema for an indexed field or a property whose name contains literal dots. */
export const resolveAspNetMultipartFieldSchema = (
  schema: SchemaObject | undefined,
  name: string,
  compositionSelection?: Record<string, number>,
): SchemaObject | undefined => resolveField(schema, name, compositionSelection).schema

/** Map a structured example or saved editor rows to the field names understood by ASP.NET Core. */
export const getAspNetMultipartFields = (
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
    const identity =
      isObject(value) || Array.isArray(value)
        ? unpackProxyShallow(value)
        : value === undefined && inputSchema && typeof inputSchema === 'object'
          ? unpackProxyShallow(inputSchema)
          : undefined
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
    visit({ name: '', value, schema, isRequired: true, isDisabled: false }, schema, ['requestBody'])
  }
  return fields
}
