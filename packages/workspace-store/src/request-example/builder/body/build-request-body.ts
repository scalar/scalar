// import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { isObject } from '@scalar/helpers/object/is-object'
import { setValueAtPath } from '@scalar/helpers/object/set-value-at-path'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'
import { isObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/type-guards'

import { getExampleFromBody } from './get-request-body-example'
import { getSelectedBodyContentType } from './get-selected-body-content-type'

type FormData = {
  mode: 'formdata'
  value: (
    | {
        type: 'text'
        key: string
        value: string
      }
    | {
        type: 'file'
        key: string
        value: File
        contentType?: string
      }
    | {
        type: 'blob'
        key: string
        value: Blob
        contentType?: string
      }
  )[]
}

type UrlEncoded = {
  mode: 'urlencoded'
  value: {
    key: string
    value: string
  }[]
}

type Raw = {
  mode: 'raw'
  value: string | File | Blob
  contentType?: string
}

export type RequestBody = FormData | UrlEncoded | Raw

const getMultipartEncodingContentType = (requestBody: RequestBodyObject, bodyContentType: string, fieldName: string) =>
  requestBody.content[bodyContentType]?.encoding?.[fieldName]?.contentType

/**
 * Build a predicate that recognizes multipart rows whose dotted name encodes a path
 * into a nested object property of the multipart schema. Without a schema (or when
 * the dotted prefix is not declared as a nested object), a row like `user.email`
 * is treated as a literal name and stays flat — only schema-derived leaves emitted
 * by `get-form-body-rows.ts` are folded back via `foldDottedRowsToObject`.
 */
const buildDottedNestedRowPredicate = (schema: unknown) => {
  const resolved = schema ? (getResolvedRef(schema) as SchemaObject | undefined) : undefined
  if (!resolved || !isObjectSchema(resolved) || !resolved.properties) {
    return (_name: string, _value: unknown) => false
  }
  const nestedTopKeys = new Set<string>()
  for (const [key, child] of Object.entries(resolved.properties)) {
    const childResolved = child ? (getResolvedRef(child) as SchemaObject | undefined) : undefined
    if (childResolved && isObjectSchema(childResolved) && childResolved.properties) {
      nestedTopKeys.add(key)
    }
  }
  return (name: string, value: unknown) => {
    if (value instanceof File || !name.includes('.')) {
      return false
    }
    const head = name.split('.', 1)[0]
    return !!head && nestedTopKeys.has(head)
  }
}

/**
 * Fold dotted-name row entries (e.g. `props.name`, `props.description`) back into a
 * single nested object so the wire shape stays one JSON multipart part per top-level
 * object property — even though the form UI displays one row per leaf.
 */
const foldDottedRowsToObject = (rows: { name: string; value: unknown }[]): Record<string, unknown> => {
  const root: Record<string, unknown> = {}
  for (const { name, value } of rows) {
    setValueAtPath(root, name.split('.'), value)
  }
  return root
}

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  /** The key of the current example */
  exampleName = 'default',
  /** Selected anyOf/oneOf request-body variants keyed by schema path */
  requestBodyCompositionSelection?: Record<string, number>,
): RequestBody | null => {
  if (!requestBody) {
    return null
  }

  /** Selected content type for the body from the dropdown, stored as x-scalar-selected-content-type */
  const bodyContentType = getSelectedBodyContentType(requestBody, exampleName)
  if (!bodyContentType) {
    return null
  }

  /** An example value */
  const example = getExampleFromBody(requestBody, bodyContentType, exampleName, requestBodyCompositionSelection)
  if (!example) {
    return null
  }

  // Form data - array format (from UI editor)
  if (
    (bodyContentType === 'multipart/form-data' || bodyContentType === 'application/x-www-form-urlencoded') &&
    Array.isArray(example.value)
  ) {
    const value = Array.isArray(example.value) ? example.value : []
    const exampleValue = value.filter((item) => !item.isDisabled) as { name: string; value: unknown }[]

    const result: FormData | UrlEncoded =
      bodyContentType === 'multipart/form-data'
        ? {
            mode: 'formdata',
            value: [],
          }
        : {
            mode: 'urlencoded',
            value: [],
          }

    // When a multipart form was built from a nested object schema the UI emits leaf
    // rows with dotted names (e.g. `props.name`). Regroup them so the wire still gets
    // one JSON multipart part per top-level object property — matching the
    // OpenAPI 3.x multipart-as-JSON default. Url-encoded forms do not nest, so we
    // skip this for them. The predicate is schema-driven, so a user-named row like
    // `user.email` whose top-level prefix is not a nested object stays flat.
    const isDottedNestedRow = buildDottedNestedRowPredicate(requestBody.content[bodyContentType]?.schema)
    const shouldRegroupDotted =
      result.mode === 'formdata' && exampleValue.some(({ name, value }) => isDottedNestedRow(name, value))

    type Entry = { name: string; value: unknown }
    let entries: Entry[]
    if (shouldRegroupDotted) {
      // Emit the regrouped top-level object at the position of its first dotted row so
      // interleaved flat rows stay in the order the user arranged them.
      const dottedRows = exampleValue.filter(({ name, value }) => isDottedNestedRow(name, value))
      const regrouped = foldDottedRowsToObject(dottedRows)
      const emittedTopKeys = new Set<string>()
      entries = []
      for (const row of exampleValue) {
        if (!isDottedNestedRow(row.name, row.value)) {
          entries.push(row)
          continue
        }
        const topKey = row.name.split('.')[0]
        if (!topKey || emittedTopKeys.has(topKey)) {
          continue
        }
        emittedTopKeys.add(topKey)
        entries.push({ name: topKey, value: regrouped[topKey] })
      }
    } else {
      entries = exampleValue
    }

    // Loop over all entries and add them to the form
    entries.forEach(({ name, value }) => {
      if (!name) {
        return
      }
      const partContentType =
        result.mode === 'formdata' ? getMultipartEncodingContentType(requestBody, bodyContentType, name) : undefined

      // Handle file uploads
      if (value instanceof File && result.mode === 'formdata') {
        /**
         * We need to unwrap the proxies to get the file name due to the
         * "this" context in the proxy causing an illegal invocation error
         */
        const unwrappedValue = unpackProxyObject(value)
        const encodedValue =
          partContentType && partContentType !== unwrappedValue.type
            ? new File([unwrappedValue], unwrappedValue.name, {
                type: partContentType,
                lastModified: unwrappedValue.lastModified,
              })
            : unwrappedValue

        return result.value.push({
          type: 'file',
          key: name,
          value: encodedValue,
          contentType: partContentType,
        })
      }

      // Text and structured inputs
      if (value !== undefined && value !== null) {
        const serializedValue =
          typeof value === 'object' && value !== null ? JSON.stringify(unpackProxyObject(value)) : String(value)

        if (result.mode === 'formdata' && partContentType) {
          return result.value.push({
            type: 'blob',
            key: name,
            value: new Blob([serializedValue], { type: partContentType }),
            contentType: partContentType,
          })
        }

        return result.value.push({
          type: 'text',
          key: name,
          value: serializedValue,
        })
      }

      return
    })

    return result
  }

  // Form data - object format (from schema examples)
  // When the example value is a plain object and content type is form-urlencoded,
  // convert to URLSearchParams instead of JSON stringifying
  if (bodyContentType === 'application/x-www-form-urlencoded' && isObject(example.value)) {
    const result: UrlEncoded = {
      mode: 'urlencoded',
      value: [],
    }

    // Convert object properties to form fields
    for (const [key, value] of Object.entries(example.value)) {
      if (key && value !== undefined && value !== null) {
        const stringValue =
          typeof value === 'object' && value !== null ? JSON.stringify(unpackProxyObject(value)) : String(value)
        result.value.push({
          key,
          value: stringValue,
        })
      }
    }

    return result
  }

  // Form data - object format (from schema examples)
  if (bodyContentType === 'multipart/form-data' && isObject(example.value)) {
    const result: FormData = {
      mode: 'formdata',
      value: [],
    }

    for (const [key, value] of Object.entries(example.value)) {
      if (!key || value === undefined || value === null) {
        continue
      }

      const partContentType = getMultipartEncodingContentType(requestBody, bodyContentType, key)

      if (value instanceof File) {
        const unwrappedValue = unpackProxyObject(value)
        const encodedValue =
          partContentType && partContentType !== unwrappedValue.type
            ? new File([unwrappedValue], unwrappedValue.name, {
                type: partContentType,
                lastModified: unwrappedValue.lastModified,
              })
            : unwrappedValue

        result.value.push({
          type: 'file',
          key,
          value: encodedValue,
          contentType: partContentType,
        })
        continue
      }

      const serializedValue =
        typeof value === 'object' && value !== null ? JSON.stringify(unpackProxyObject(value)) : String(value)

      if (partContentType) {
        result.value.push({
          type: 'blob',
          key,
          value: new Blob([serializedValue], { type: partContentType }),
          contentType: partContentType,
        })
        continue
      }

      result.value.push({
        type: 'text',
        key,
        value: serializedValue,
      })
    }

    return result
  }

  // Any other type
  const exampleValue =
    example.value !== null && typeof example.value === 'object' ? unpackProxyObject(example.value) : example.value

  // File type
  if (exampleValue instanceof File) {
    return {
      mode: 'raw',
      value: exampleValue,
      contentType: exampleValue.type,
    }
  }

  // Object type
  if (typeof exampleValue === 'object') {
    return {
      mode: 'raw',
      value: JSON.stringify(exampleValue),
      contentType: 'application/json',
    }
  }

  // Return binary or string values
  return {
    mode: 'raw',
    value: exampleValue,
  }
}
