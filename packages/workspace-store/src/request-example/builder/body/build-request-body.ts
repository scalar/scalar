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
import { serializeFormPropertyWithEncoding } from './serialize-form-property'

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
    //
    // Single pass: flat rows go into `entries` as-is; for each dotted-nested row, we
    // lazily allocate the regrouped object for its top-level key and push it into
    // `entries` at the position of the *first* matching row, then keep folding leaves
    // into the same live object reference so interleaved flat rows keep their order.
    const isDottedNestedRow =
      result.mode === 'formdata'
        ? buildDottedNestedRowPredicate(requestBody.content[bodyContentType]?.schema)
        : () => false

    const entries: { name: string; value: unknown }[] = []
    const regroupedByTopKey = new Map<string, Record<string, unknown>>()

    for (const row of exampleValue) {
      if (!isDottedNestedRow(row.name, row.value)) {
        entries.push(row)
        continue
      }
      const segments = row.name.split('.')
      const topKey = segments[0]
      if (!topKey) {
        continue
      }
      let target = regroupedByTopKey.get(topKey)
      if (!target) {
        target = {}
        regroupedByTopKey.set(topKey, target)
        entries.push({ name: topKey, value: target })
      }
      setValueAtPath(target, segments.slice(1), row.value)
    }

    // Loop over all entries and add them to the form
    entries.forEach(({ name, value }) => {
      if (!name) {
        return
      }
      const partEncoding = requestBody.content[bodyContentType]?.encoding?.[name]

      // When the encoding sets style/explode, serialize objects/arrays RFC6570-style
      // (bracket or exploded notation) instead of JSON, so the wire request matches the
      // generated code snippet.
      const styleParts = serializeFormPropertyWithEncoding(name, value, partEncoding)
      if (styleParts) {
        for (const part of styleParts) {
          result.value.push({ type: 'text', key: part.key, value: part.value })
        }
        return
      }

      const partContentType = result.mode === 'formdata' ? partEncoding?.contentType : undefined

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
        const partEncoding = requestBody.content[bodyContentType]?.encoding?.[key]

        // Encoding style/explode turns objects into bracket or exploded notation.
        const styleParts = serializeFormPropertyWithEncoding(key, value, partEncoding)
        if (styleParts) {
          for (const part of styleParts) {
            result.value.push({ key: part.key, value: part.value })
          }
          continue
        }

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

      const partEncoding = requestBody.content[bodyContentType]?.encoding?.[key]

      // Encoding style/explode turns objects into bracket or exploded notation instead of
      // the default single JSON part.
      const styleParts = serializeFormPropertyWithEncoding(key, value, partEncoding)
      if (styleParts) {
        for (const part of styleParts) {
          result.value.push({ type: 'text', key: part.key, value: part.value })
        }
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
