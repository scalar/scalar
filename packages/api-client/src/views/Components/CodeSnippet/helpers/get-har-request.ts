import { buildRequestSecurity } from '@/libs/send-request/build-request-security'
import type { Operation, RequestExample, SecurityScheme, Server } from '@scalar/oas-utils/entities/spec'
import type { HarRequest } from '@scalar/snippetz'
import { replaceTemplateVariables } from '@/libs/string-template'
import { REGEX } from '@scalar/oas-utils/helpers'
import type { EnvVariables } from '@/libs/env-helpers'

import { convertToHarRequest } from './convert-to-har-request'

const EMPTY_TOKEN_PLACEHOLDER = 'YOUR_SECRET_TOKEN'

/**
 * Creates a snippetz-compatible HarRequest from OpenAPI-like store entities
 */
export const getHarRequest = ({
  operation,
  example,
  server,
  securitySchemes = [],
  environment,
}: {
  operation?: Operation | undefined
  example?: RequestExample | undefined
  server?: Server | undefined
  securitySchemes?: SecurityScheme[]
  environment?: EnvVariables | undefined
}): HarRequest => {
  // Convert environment variables to a key-value object
  const env =
    environment && Array.isArray(environment)
      ? Object.fromEntries(environment.map((v: any) => [v.key, v.value]))
      : environment || {}

  const serverString = (() => {
    if (server?.url && (REGEX.VARIABLES.test(server.url) || REGEX.PATH.test(server.url))) {
      const serverParams = Object.entries(server?.variables || {}).reduce<Record<string, string>>(
        (acc, [key, variable]) => {
          const pathParamValue = example?.parameters?.path.find((p) => p.enabled && p.key === key)?.value
          if (pathParamValue) {
            acc[key] = replaceTemplateVariables(pathParamValue, env)
          } else if (variable.default) {
            acc[key] = replaceTemplateVariables(variable.default, env)
          }
          return acc
        },
        {},
      )
      return replaceTemplateVariables(replaceTemplateVariables(server.url, env), serverParams)
    }
    return server?.url
  })()

  const pathString = (() => {
    const path = operation?.path ?? '/'
    if (path && (REGEX.VARIABLES.test(path) || REGEX.PATH.test(path))) {
      const pathVars = (example?.parameters?.path ?? []).reduce<Record<string, string>>((vars, param) => {
        if (param.enabled) {
          vars[param.key] = replaceTemplateVariables(param.value, env)
        }
        return vars
      }, {})
      return replaceTemplateVariables(replaceTemplateVariables(path, env), pathVars)
    }
    return path
  })()

  // Grab the security headers, cookies and url params
  const security = buildRequestSecurity(securitySchemes, env, EMPTY_TOKEN_PLACEHOLDER)

  // Merge the security headers, cookies and query with example parameters
  const headers = [
    ...((example?.parameters.headers ?? []).map((h) => ({
      ...h,
      value:
        REGEX.VARIABLES.test(h.value) || REGEX.PATH.test(h.value) ? replaceTemplateVariables(h.value, env) : h.value,
    })) ?? []),
    ...Object.entries(security.headers).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]
  const cookies = [
    ...((example?.parameters.cookies ?? []).map((c) => ({
      ...c,
      value:
        REGEX.VARIABLES.test(c.value) || REGEX.PATH.test(c.value) ? replaceTemplateVariables(c.value, env) : c.value,
    })) ?? []),
    ...security.cookies.map((cookie) => ({
      key: cookie.name,
      value: cookie.value,
      enabled: true,
    })),
  ]
  const query = [
    ...((example?.parameters.query ?? []).map((q) => ({
      ...q,
      value:
        REGEX.VARIABLES.test(q.value) || REGEX.PATH.test(q.value) ? replaceTemplateVariables(q.value, env) : q.value,
    })) ?? []),
    ...Array.from(security.urlParams.entries()).map(([key, value]) => ({
      key,
      value,
      enabled: true,
    })),
  ]

  // Fallback variable replacement for body (raw)
  const body = (() => {
    const body = example?.body
    if (body?.raw?.value && (REGEX.VARIABLES.test(body.raw.value) || REGEX.PATH.test(body.raw.value))) {
      return {
        ...body,
        raw: {
          ...body.raw,
          value: replaceTemplateVariables(body.raw.value, env),
        },
      }
    }
    return body
  })()

  // Converts it to a snippetz-compatible HarRequest
  return convertToHarRequest({
    baseUrl: serverString,
    method: operation?.method ?? 'get',
    path: pathString,
    body,
    cookies,
    headers,
    query,
  })
}
