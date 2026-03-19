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

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  /** The key of the current example */
  exampleName = 'default',
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
  const example = getExampleFromBody(requestBody, bodyContentType, exampleName)
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
    const form = bodyContentType === 'multipart/form-data' ? new FormData() : new URLSearchParams()

    const result: FormData = {
      mode: 'formdata',
      value: [],
    }

    // Loop over all entries and add them to the form
    exampleValue.forEach(({ name, value }) => {
      if (!name) {
        return
      }
      const partContentType =
        form instanceof FormData ? getMultipartEncodingContentType(requestBody, bodyContentType, name) : undefined

      // Handle file uploads
      if (value instanceof File && form instanceof FormData) {
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

        result.value.push({
          type: 'file',
          key: name,
          value: encodedValue,
          contentType: partContentType,
        })
        form.append(name, encodedValue, encodedValue.name)
      }
      // Text and structured inputs
      else if (value !== undefined && value !== null) {
        const serializedValue =
          typeof value === 'object' && value !== null ? JSON.stringify(unpackProxyObject(value)) : String(value)

        if (form instanceof FormData && partContentType) {
          result.value.push({
            type: 'text',
            key: name,
            value: serializedValue,
          })
          form.append(name, new Blob([serializedValue], { type: partContentType }))
          result.value.push({
            type: 'blob',
            key: name,
            value: new Blob([serializedValue], { type: partContentType }),
            contentType: partContentType,
          })
        } else {
          form.append(name, serializedValue)
          result.value.push({
            type: 'text',
            key: name,
            value: serializedValue,
          })
        }
      }
    })

    return result
  }

  // Form data - object format (from schema examples)
  // When the example value is a plain object and content type is form-urlencoded,
  // convert to URLSearchParams instead of JSON stringifying
  if (
    bodyContentType === 'application/x-www-form-urlencoded' &&
    example.value !== null &&
    typeof example.value === 'object' &&
    !Array.isArray(example.value)
  ) {
    const form = new URLSearchParams()
    const result: UrlEncoded = {
      mode: 'urlencoded',
      value: [],
    }

    // Convert object properties to form fields
    for (const [key, value] of Object.entries(example.value)) {
      if (key && value !== undefined && value !== null) {
        const stringValue = typeof value === 'string' ? value : String(value)
        form.append(key, stringValue)
        result.value.push({
          key,
          value: stringValue,
        })
      }
    }

    return result
  }

  const exampleValue =
    example.value !== null && typeof example.value === 'object' ? unpackProxyObject(example.value) : example.value

  if (exampleValue instanceof File) {
    return {
      mode: 'raw',
      value: exampleValue,
      contentType: exampleValue.type,
    }
  }

  // Ensure we stringify the example value if it is an object
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
