import { getFirstMediaType } from '@scalar/helpers/http/get-first-media-type'
import { isJsonMediaType } from '@scalar/helpers/http/is-json-media-type'
import { parseMimeType } from '@scalar/helpers/http/mime-type'
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
  /** URI-ready parameter examples, serialized media examples, or data requiring media serialization. */
  kind: 'uri-ready' | 'serialized' | 'data'
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
  const [contentType, media] = getFirstMediaType(parameter.content) ?? []
  if (!contentType) {
    return undefined
  }
  const mediaType = getResolvedRef(media)
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
    kind:
      parameterExample?.serializedValue !== undefined
        ? 'uri-ready'
        : example?.serializedValue !== undefined || (example?.dataValue === undefined && typeof value === 'string')
          ? 'serialized'
          : 'data',
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
  if (parameter.kind === 'uri-ready') {
    return String(value)
  }
  const contentType = parseMimeType(parameter.contentType).essence
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
          !styleBased && (isJsonMediaType(encoding?.contentType) || (part !== null && typeof part === 'object'))
        params.append(key, json ? JSON.stringify(part) : String(part ?? ''))
      }
      if (encoding?.allowReserved) {
        reservedKeys.add(key)
      }
    }
    return applyAllowReservedToUrl(`?${params}`, reservedKeys).slice(1)
  }
  const serialized =
    parameter.kind === 'serialized'
      ? String(value)
      : isJsonMediaType(contentType)
        ? JSON.stringify(value)
        : String(value)
  return encodeURIComponent(serialized).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}
