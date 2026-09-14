import { isObject } from '@scalar/helpers/object/is-object'
import { replaceEnvVariables } from '@scalar/helpers/regex/replace-variables'

import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { serializeFormPropertyWithEncoding } from '@/request-example/builder/body/serialize-form-property'
import { isParamDisabled } from '@/request-example/builder/header/is-param-disabled'
import { applyAllowReservedToUrl } from '@/request-example/builder/helpers/apply-allow-reserved-to-url'
import { getExample } from '@/request-example/builder/helpers/get-example'
import { getExampleFromSchema } from '@/request-example/builder/helpers/get-example-from-schema'
import type { EncodingObject, ParameterObject } from '@/schemas/v3.2/strict/openapi-document'

/** A whole query string, kept separate from named parameters until URL serialization. */
export type QuerystringParameter = {
  value: unknown
  contentType: string
  encoding?: Record<string, EncodingObject>
  /** Parameter-level serialized examples already include URI escaping. */
  uriEncoded: boolean
  /** Media-level serialized examples need URI escaping, but no media serialization. */
  serialized: boolean
}

/** Resolve the selected whole-query example, including content-schema defaults. */
export const getQuerystringParameter = (
  parameter: ParameterObject,
  exampleName?: string,
  {
    defaultDisabled = true,
    includeDisabled = false,
  }: {
    defaultDisabled?: boolean
    /** Editors must retain the value when its checkbox is off. */
    includeDisabled?: boolean
  } = {},
): QuerystringParameter | undefined => {
  if (parameter.in !== 'querystring' || !('content' in parameter) || !parameter.content) {
    return undefined
  }
  const contentType = Object.keys(parameter.content)[0]
  if (!contentType) {
    return undefined
  }
  const mediaType = getResolvedRef(parameter.content[contentType])
  const example = getExample(parameter, exampleName, contentType)
  if (!includeDisabled && isParamDisabled(parameter, example, defaultDisabled)) {
    return undefined
  }
  const parameterExample = getExample({ ...parameter, content: undefined }, exampleName, undefined)
  const value = example?.serializedValue ?? (example?.dataValue !== undefined ? example.dataValue : example?.value)
  const schema = getResolvedRef(mediaType?.schema)
  return {
    value: value !== undefined ? value : schema ? getExampleFromSchema(schema) : '',
    contentType,
    encoding: mediaType?.encoding,
    uriEncoded: example?.serializedValue !== undefined && parameterExample === example,
    serialized:
      example?.serializedValue !== undefined || (example?.dataValue === undefined && typeof value === 'string'),
  }
}

/** Serialize without introducing a parameter name or re-encoding URI-ready examples. */
export const serializeQuerystringParameter = (
  parameter: QuerystringParameter,
  variables: Record<string, string> | ((value: string) => string | null) = {},
): string => {
  const replace = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return replaceEnvVariables(value, variables)
    }
    if (Array.isArray(value)) {
      return value.map(replace)
    }
    if (isObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [replaceEnvVariables(key, variables), replace(item)]),
      )
    }
    return value
  }
  const value = replace(parameter.value)
  if (parameter.uriEncoded) {
    return String(value)
  }
  const contentType = parameter.contentType.split(';')[0]?.trim().toLowerCase()
  if (contentType === 'application/x-www-form-urlencoded') {
    if (typeof value === 'string') {
      return value
    }
    const params = new URLSearchParams()
    const reservedKeys = new Set<string>()
    for (const [key, item] of Object.entries(isObject(value) ? value : {})) {
      const encoding = parameter.encoding?.[key]
      const entries = serializeFormPropertyWithEncoding(key, item, encoding)
      if (entries) {
        for (const entry of entries) {
          params.append(entry.key, entry.value)
          if (encoding?.allowReserved) {
            reservedKeys.add(entry.key)
          }
        }
        continue
      }
      const styleBased =
        encoding?.style !== undefined || encoding?.explode !== undefined || encoding?.allowReserved !== undefined
      for (const part of Array.isArray(item) ? item : [item]) {
        const json =
          !styleBased &&
          (/(?:\/|\+)json(?:;|$)/i.test(encoding?.contentType ?? '') || (part !== null && typeof part === 'object'))
        params.append(key, json ? JSON.stringify(part) : String(part ?? ''))
      }
      if (encoding?.allowReserved) {
        reservedKeys.add(key)
      }
    }
    return applyAllowReservedToUrl(`?${params}`, reservedKeys).slice(1)
  }
  const serialized = parameter.serialized
    ? String(value)
    : /(?:\/|\+)json$/.test(contentType ?? '')
      ? JSON.stringify(value)
      : String(value)
  return encodeURIComponent(serialized).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}
