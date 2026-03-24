import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { RequestBodyObject } from '@scalar/workspace-store/schemas/v3.1/strict/request-body'

import { getSelectedBodyContentType } from '@/v2/blocks/operation-block/helpers/get-selected-body-content-type'
import { getExampleFromBody } from '@/v2/blocks/request-block/helpers/get-request-body-example'

const getMultipartEncodingContentType = (
  requestBody: RequestBodyObject,
  bodyContentType: string,
  fieldName: string,
  replacedFieldName: string,
) =>
  requestBody.content[bodyContentType]?.encoding?.[fieldName]?.contentType ??
  requestBody.content[bodyContentType]?.encoding?.[replacedFieldName]?.contentType

const serializeMultipartValue = (value: unknown, env: Record<string, string>) => {
  if (typeof value === 'string') {
    return replaceEnvVariables(value, env)
  }

  const serializedValue =
    typeof value === 'object' && value !== null ? JSON.stringify(unpackProxyObject(value)) : String(value)

  return replaceEnvVariables(serializedValue, env)
}

/**
 * Create the fetch request body
 */
export const buildRequestBody = (
  requestBody: RequestBodyObject | undefined,
  /** Environment variables flattened into a key-value object */
  env: Record<string, string> = {},
  /** The key of the current example */
  exampleKey = 'default',
): BodyInit | null => {
  if (!requestBody) {
    return null
  }

  /** Selected content type for the body from the dropdown, stored as x-scalar-selected-content-type */
  const bodyContentType = getSelectedBodyContentType(requestBody, exampleKey)
  if (!bodyContentType) {
    return null
  }

  /** An example value or generated example from the schema */
  const example = getExampleFromBody(requestBody, bodyContentType, exampleKey)
  if (!example) {
    return null
  }

  // Form data - array format (from UI editor)
  if (
    (bodyContentType === 'multipart/form-data' || bodyContentType === 'application/x-www-form-urlencoded') &&
    Array.isArray(example.value)
  ) {
    const exampleValue = example.value.filter((item) => !item.isDisabled) as { name: string; value: unknown }[]
    const form = bodyContentType === 'multipart/form-data' ? new FormData() : new URLSearchParams()

    // Loop over all entries and add them to the form
    exampleValue.forEach(({ name, value }) => {
      if (!name) {
        return
      }
      const replacedName = replaceEnvVariables(name, env)
      const partContentType =
        form instanceof FormData
          ? getMultipartEncodingContentType(requestBody, bodyContentType, name, replacedName)
          : undefined

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

        form.append(replacedName, encodedValue, encodedValue.name)
      }
      // Text and structured inputs
      else if (value !== undefined && value !== null) {
        const serializedValue = serializeMultipartValue(value, env)

        if (form instanceof FormData && partContentType) {
          form.append(replacedName, new Blob([serializedValue], { type: partContentType }))
        } else {
          form.append(replacedName, serializedValue)
        }
      }
    })

    return form
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

    // Convert object properties to form fields
    for (const [key, value] of Object.entries(example.value)) {
      if (key && value !== undefined && value !== null) {
        const replacedKey = replaceEnvVariables(key, env)
        const stringValue = typeof value === 'string' ? value : String(value)
        form.append(replacedKey, replaceEnvVariables(stringValue, env))
      }
    }

    return form
  }

  const exampleValue =
    example.value !== null && typeof example.value === 'object' ? unpackProxyObject(example.value) : example.value

  if (exampleValue instanceof File) {
    return exampleValue
  }

  // Ensure we stringify the example value if it is an object
  if (typeof exampleValue === 'object') {
    return replaceEnvVariables(JSON.stringify(exampleValue), env)
  }

  // Return binary or string values
  return typeof exampleValue === 'string' ? replaceEnvVariables(exampleValue, env) : exampleValue
}
