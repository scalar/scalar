// import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'

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

const appendMultipartValue = ({
  fieldName,
  fieldValue,
  requestBody,
  bodyContentType,
  target,
}: {
  fieldName: string
  fieldValue: unknown
  requestBody: RequestBodyObject
  bodyContentType: string
  target: FormData['value']
}): void => {
  if (!fieldName || fieldValue === undefined || fieldValue === null) {
    return
  }

  const partContentType = getMultipartEncodingContentType(requestBody, bodyContentType, fieldName)

  if (fieldValue instanceof File) {
    /**
     * We need to unwrap proxies so file metadata access keeps the right "this" context.
     */
    const unwrappedValue = unpackProxyObject(fieldValue)
    const encodedValue =
      partContentType && partContentType !== unwrappedValue.type
        ? new File([unwrappedValue], unwrappedValue.name, {
            type: partContentType,
            lastModified: unwrappedValue.lastModified,
          })
        : unwrappedValue

    target.push({
      type: 'file',
      key: fieldName,
      value: encodedValue,
      contentType: partContentType,
    })
    return
  }

  if (fieldValue instanceof Blob) {
    const encodedValue =
      partContentType && partContentType !== fieldValue.type
        ? new Blob([fieldValue], { type: partContentType })
        : fieldValue
    target.push({
      type: 'blob',
      key: fieldName,
      value: encodedValue,
      contentType: partContentType,
    })
    return
  }

  const serializedValue =
    typeof fieldValue === 'object' ? JSON.stringify(unpackProxyObject(fieldValue)) : String(fieldValue)

  if (partContentType) {
    target.push({
      type: 'blob',
      key: fieldName,
      value: new Blob([serializedValue], { type: partContentType }),
      contentType: partContentType,
    })
    return
  }

  target.push({
    type: 'text',
    key: fieldName,
    value: serializedValue,
  })
}

const serializeUrlEncodedValue = (value: unknown): string => {
  // Urlencoded examples historically JSON-encode object-like values.
  // Using String(value) here would turn objects into "[object Object]".
  if (typeof value === 'object' && value !== null && !(value instanceof File) && !(value instanceof Blob)) {
    return JSON.stringify(unpackProxyObject(value))
  }

  return typeof value === 'string' ? value : String(value)
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

    // Loop over all entries and add them to the selected form mode.
    // Multipart keeps rich value types (file/blob/text), while urlencoded keeps plain key/value strings.
    exampleValue.forEach(({ name, value }) => {
      if (result.mode === 'formdata') {
        appendMultipartValue({
          fieldName: name,
          fieldValue: value,
          requestBody,
          bodyContentType,
          target: result.value,
        })
        return
      }

      if (name && value !== undefined && value !== null) {
        result.value.push({
          key: name,
          value: serializeUrlEncodedValue(value),
        })
      }
    })

    return result
  }

  // Form data & Form Urlencoded - object format (from schema examples)
  // Convert plain objects to form fields instead of JSON stringifying.
  if (
    (bodyContentType === 'multipart/form-data' || bodyContentType === 'application/x-www-form-urlencoded') &&
    example.value !== null &&
    typeof example.value === 'object' &&
    !Array.isArray(example.value) &&
    !(example.value instanceof File) &&
    !(example.value instanceof Blob)
  ) {
    const unwrappedExampleValue = unpackProxyObject(example.value) as Record<string, unknown>
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

    // Convert object properties to form fields
    for (const [key, value] of Object.entries(unwrappedExampleValue)) {
      if (key && value !== undefined && value !== null) {
        if (result.mode === 'formdata') {
          appendMultipartValue({
            fieldName: key,
            fieldValue: value,
            requestBody,
            bodyContentType,
            target: result.value,
          })
        } else {
          result.value.push({
            key,
            value: serializeUrlEncodedValue(value),
          })
        }
      }
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
