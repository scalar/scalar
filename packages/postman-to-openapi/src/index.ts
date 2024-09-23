import type { OpenAPIV3 } from '@scalar/openapi-types'
import { parse as parseJsonc } from 'jsonc-parser'
import camelCase from 'lodash.camelcase'

import type {
  Options,
  PostmanUrl,
  PostmanVariable,
  SecurityDefinition,
} from './types'

function parseMdTable(): Record<string, any> {
  return {}
}

function replacePostmanVariables(collectionFile: any): any {
  return collectionFile
}

/**
 * Converts a Postman collection to an OpenAPI specification.
 *
 * @param {string | Record<string, any>} collectionContent - The Postman collection content, either as a JSON string or an object.
 * @param {Options} [options={}] - Configuration options for the conversion process.
 * @returns {Promise<string>} A promise that resolves to the OpenAPI specification as a JSON string.
 */
async function postmanToOpenApi(
  collectionContent: string | Record<string, any>,
  options: Options = {},
): Promise<string> {
  const {
    info = {},
    defaultTag = 'default',
    pathDepth = 0,
    auth: optsAuth,
    servers,
    externalDocs = {},
    folders = {},
    responseHeaders = true,
    replaceVars = false,
    disabledParams = { includeQuery: false, includeHeader: false },
    operationId = 'off',
  } = options

  let collectionFile: Record<string, any>
  if (typeof collectionContent === 'string') {
    collectionFile = JSON.parse(collectionContent)
  } else {
    collectionFile = collectionContent
  }
  if (replaceVars) {
    collectionFile = replacePostmanVariables(collectionFile)
  }
  const postmanJson = collectionFile.collection || collectionFile
  const { item: items = [], variable = [] } = postmanJson
  const paths: Record<string, any> = {}
  const domains = new Set<string>()
  const tags: Record<string, any> = {}
  const securitySchemes: Record<string, any> = {}

  for (let i = 0; i < items.length; i++) {
    let element = items[i]
    while (element?.item != null) {
      const { item = [], description: tagDesc = '' } = element
      const tag = calculateFolderTag(element, folders)
      const tagged = item.map((e: any) => ({ ...e, tag }))
      tags[tag] = tagDesc
      items.splice(i, 1, ...tagged)
      element = tagged.length > 0 ? tagged.shift() : items[i]
    }
    if (element != null) {
      const {
        request = {},
        name,
        tag = defaultTag,
        event: events,
        response,
      } = element
      const {
        url,
        method,
        body,
        description: rawDesc,
        header = [],
        auth,
      } = request
      if (!url || !method) continue
      const { path, query, protocol, host, port, valid, pathVars } =
        scrapeURL(url)
      if (valid) {
        const summary = name.replace(/ \[([^[\]]*)\]/gi, '')
        domains.add(calculateDomains(protocol, host, port))
        const joinedPath = calculatePath(path, pathDepth)
        if (!paths[joinedPath]) paths[joinedPath] = {}
        const { description, paramsMeta } = descriptionParse(rawDesc)
        paths[joinedPath][method.toLowerCase()] = {
          tags: [tag],
          summary,
          ...calculateOperationId(operationId, name, summary),
          ...(description ? { description } : {}),
          ...parseBody(body, method),
          ...parseOperationAuth(auth, securitySchemes, optsAuth),
          ...parseParameters(
            query,
            header,
            joinedPath,
            paramsMeta,
            pathVars,
            disabledParams,
          ),
          ...parseResponse(response, events, responseHeaders),
        }
      }
    }
  }

  const openApi: OpenAPIV3.Document = {
    // TODO: We should output `3.1.0`, it’s probably enough to bump the version number here.
    openapi: '3.0.0',
    info: compileInfo(postmanJson, info),
    ...parseExternalDocs(variable, externalDocs),
    ...parseServers(domains, servers),
    ...parseAuth(postmanJson, optsAuth, securitySchemes),
    ...parseTags(tags),
    paths,
  }

  return JSON.stringify(openApi, null, 4)
}

/* Helper Functions */

function calculateFolderTag(
  { tag, name }: { tag: string; name: string },
  { separator = ' > ', concat = true },
): string {
  return tag && concat ? `${tag}${separator}${name}` : name
}

function compileInfo(postmanJson: any, optsInfo: any): any {
  const { info = {}, variable = [] } = postmanJson
  const { name, description: desc } = info
  const ver = getVarValue(variable, 'version', '1.0.0')
  const {
    title = name,
    description = desc,
    version = ver,
    termsOfService,
    license,
    contact,
    xLogo,
  } = optsInfo
  return {
    title,
    description,
    version,
    ...parseXLogo(variable, xLogo),
    ...(termsOfService ? { termsOfService } : {}),
    ...parseContact(variable, contact),
    ...parseLicense(variable, license),
  }
}

function parseXLogo(variables: PostmanVariable[], xLogo: any = {}): any {
  const urlVar = getVarValue(variables, 'x-logo.urlVar')
  const backgroundColorVar = getVarValue(variables, 'x-logo.backgroundColorVar')
  const altTextVar = getVarValue(variables, 'x-logo.altTextVar')
  const hrefVar = getVarValue(variables, 'x-logo.hrefVar')
  const {
    url = urlVar,
    backgroundColor = backgroundColorVar,
    altText = altTextVar,
    href = hrefVar,
  } = xLogo
  return url != null
    ? { 'x-logo': { url, backgroundColor, altText, href } }
    : {}
}

function parseLicense(
  variables: PostmanVariable[],
  optsLicense: any = {},
): any {
  const nameVar = getVarValue(variables, 'license.name')
  const urlVar = getVarValue(variables, 'license.url')
  const { name = nameVar, url = urlVar } = optsLicense
  return name != null ? { license: { name, ...(url ? { url } : {}) } } : {}
}

function parseContact(
  variables: PostmanVariable[],
  optsContact: any = {},
): any {
  const nameVar = getVarValue(variables, 'contact.name')
  const urlVar = getVarValue(variables, 'contact.url')
  const emailVar = getVarValue(variables, 'contact.email')
  const { name = nameVar, url = urlVar, email = emailVar } = optsContact
  return [name, url, email].some((e) => e != null)
    ? {
        contact: {
          ...(name ? { name } : {}),
          ...(url ? { url } : {}),
          ...(email ? { email } : {}),
        },
      }
    : {}
}

function parseExternalDocs(
  variables: PostmanVariable[],
  optsExternalDocs: any,
): any {
  const descriptionVar = getVarValue(variables, 'externalDocs.description')
  const urlVar = getVarValue(variables, 'externalDocs.url')
  const { description = descriptionVar, url = urlVar } = optsExternalDocs
  return url != null
    ? { externalDocs: { url, ...(description ? { description } : {}) } }
    : {}
}

function parseBody(body: any = {}, method: string): any {
  if (['GET', 'DELETE'].includes(method)) return {}
  const { mode, raw, options = { raw } } = body
  let content: any = {}
  switch (mode) {
    case 'raw': {
      const { raw: rawOptions = {} } = options
      const { language } = rawOptions
      let example: any = ''
      if (language === 'json') {
        if (raw) {
          const errors: any[] = []
          example = parseJsonc(raw, errors)
          if (errors.length > 0) {
            example = raw
          }
        }
        content = {
          'application/json': {
            schema: {
              type: 'object',
              example,
            },
          },
        }
      } else if (language === 'text') {
        content = {
          'text/plain': {
            schema: {
              type: 'string',
              example: raw,
            },
          },
        }
      } else {
        content = {
          '*/*': {
            schema: {
              type: 'string',
              example: JSON.stringify(raw),
            },
          },
        }
      }
      break
    }
    case 'file':
      content = {
        'text/plain': {},
      }
      break
    case 'formdata': {
      content = {
        'multipart/form-data': parseFormData(body.formdata),
      }
      break
    }
    case 'urlencoded':
      content = {
        'application/x-www-form-urlencoded': parseFormData(body.urlencoded),
      }
      break
  }
  return { requestBody: { content } }
}

function parseFormData(data: any[]): any {
  const objectSchema: any = {
    schema: {
      type: 'object',
    },
  }
  return data.reduce((obj: any, { key, type, description, value }: any) => {
    const { schema } = obj
    if (isRequired(description)) {
      ;(schema.required = schema.required || []).push(key)
    }
    ;(schema.properties = schema.properties || {})[key] = {
      type: inferType(value),
      ...(description
        ? { description: description.replace(/ ?\[required\] ?/gi, '') }
        : {}),
      ...(value ? { example: value } : {}),
      ...(type === 'file' ? { format: 'binary' } : {}),
    }
    return obj
  }, objectSchema)
}

function parseParameters(
  query: any[] = [],
  header: any[] = [],
  paths: string,
  paramsMeta: any = {},
  pathVars: any = {},
  { includeQuery = false, includeHeader = false }: any = {},
  paramInserter: (
    parameterMap: Map<string, any>,
    param: any,
  ) => Map<string, any> = defaultParamInserter,
): any {
  const parameters = [
    ...Array.from(
      header
        .reduce(
          mapParameters('header', includeHeader, paramInserter),
          new Map(),
        )
        .values(),
    ),
  ]
  parameters.push(
    ...Array.from(
      query
        .reduce(mapParameters('query', includeQuery, paramInserter), new Map())
        .values(),
    ),
  )
  parameters.push(...extractPathParameters(paths, paramsMeta, pathVars))
  return parameters.length ? { parameters } : {}
}

function mapParameters(
  type: string,
  includeDisabled: boolean,
  paramInserter: (
    parameterMap: Map<string, any>,
    param: any,
  ) => Map<string, any>,
): (parameterMap: Map<string, any>, param: any) => Map<string, any> {
  return (
    parameterMap: Map<string, any>,
    { key, description = '', value, disabled }: any,
  ) => {
    if (!includeDisabled && disabled === true) return parameterMap
    const required = /\[required\]/gi.test(description)
    paramInserter(parameterMap, {
      name: key,
      in: type,
      schema: { type: inferType(value) },
      ...(required ? { required } : {}),
      ...(description
        ? { description: description.replace(/ ?\[required\] ?/gi, '') }
        : {}),
      ...(value ? { example: value } : {}),
    })
    return parameterMap
  }
}

function extractPathParameters(
  paths: string,
  paramsMeta: any,
  pathVars: any,
): any[] {
  const matched = paths.match(/{\s*[\w-]+\s*}/g) || []
  return matched.map((match) => {
    const name = match.slice(1, -1)
    const {
      type: varType = 'string',
      description: desc,
      value,
    } = pathVars[name] || {}
    const {
      type = varType,
      description = desc,
      example = value,
    } = paramsMeta[name] || {}
    return {
      name,
      in: 'path',
      schema: { type },
      required: true,
      ...(description ? { description } : {}),
      ...(example ? { example } : {}),
    }
  })
}

function getVarValue(
  variables: PostmanVariable[],
  name: string,
  def: any = undefined,
): any {
  const variable = variables.find(({ key }) => key === name)
  return variable ? variable.value : def
}

function inferType(value: any): string {
  if (/^\d+$/.test(value)) return 'integer'
  if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value)) return 'number'
  if (/^(true|false)$/.test(value)) return 'boolean'
  return 'string'
}

function parseAuth(postmanJson: any, optAuth: any, securitySchemes: any): any {
  const { auth } = postmanJson
  if (optAuth != null) {
    return parseOptsAuth(optAuth)
  }
  return parsePostmanAuth(auth, securitySchemes)
}

function parsePostmanAuth(postmanAuth: any = {}, securitySchemes: any): any {
  const { type } = postmanAuth
  if (type != null) {
    securitySchemes[`${type}Auth`] = {
      type: 'http',
      scheme: type,
    }
    return {
      components: { securitySchemes },
      security: [
        {
          [`${type}Auth`]: [],
        },
      ],
    }
  }
  return Object.keys(securitySchemes).length === 0
    ? {}
    : { components: { securitySchemes } }
}

function parseOperationAuth(
  auth: any,
  securitySchemes: any,
  optsAuth: any,
): any {
  if (auth == null || optsAuth != null) {
    return {}
  } else {
    const { type } = auth
    securitySchemes[`${type}Auth`] = {
      type: 'http',
      scheme: type,
    }
    return {
      security: [{ [`${type}Auth`]: [] }],
    }
  }
}

function parseOptsAuth(optAuth: Record<string, SecurityDefinition> = {}): any {
  const securitySchemes: any = {}
  const security: any[] = []
  for (const [secName, secDefinition] of Object.entries(optAuth)) {
    const { type, scheme, ...rest } = secDefinition
    if (type === 'http' && ['bearer', 'basic'].includes(scheme)) {
      securitySchemes[secName] = {
        type: 'http',
        scheme,
        ...rest,
      }
      security.push({ [secName]: [] })
    }
  }
  return Object.keys(securitySchemes).length === 0
    ? {}
    : {
        components: { securitySchemes },
        security,
      }
}

function calculatePath(pathArray: string[], pathDepth: number): string {
  const paths = pathArray.slice(pathDepth)
  return (
    '/' +
    paths
      .map((path) => {
        let newPath = path.replace(/([{}])\1+/g, '$1')
        newPath = newPath.replace(/^:(.*)/g, `{$1}`)
        return newPath
      })
      .join('/')
  )
}

function calculateDomains(
  protocol: string,
  hosts: string[],
  port: string,
): string {
  return protocol + '://' + hosts.join('.') + (port ? `:${port}` : '')
}

function scrapeURL(url: string | PostmanUrl): any {
  if (
    url === undefined ||
    url === '' ||
    (typeof url !== 'string' && url.raw === '')
  ) {
    return { valid: false }
  }
  const rawUrl = typeof url === 'string' ? url : url.raw
  const fixedUrl = rawUrl.startsWith('{{') ? 'http://' + rawUrl : rawUrl
  let objUrl: URL
  try {
    objUrl = new URL(fixedUrl)
  } catch (e) {
    return { valid: false }
  }
  return {
    raw: rawUrl,
    path: decodeURIComponent(objUrl.pathname).slice(1).split('/'),
    query: compoundQueryParams(
      objUrl.searchParams,
      typeof url !== 'string' ? url.query : [],
    ),
    protocol: objUrl.protocol.slice(0, -1),
    host: decodeURIComponent(objUrl.hostname).split('.'),
    port: objUrl.port,
    valid: true,
    pathVars:
      typeof url !== 'string' && url.variable != null
        ? url.variable.reduce((obj: any, { key, value, description }: any) => {
            obj[key] = { value, description, type: inferType(value) }
            return obj
          }, {})
        : {},
  }
}

function compoundQueryParams(
  searchParams: URLSearchParams,
  queryCollection: any[] = [],
): any[] {
  return queryCollection
}

function parseServers(domains: Set<string>, serversOpts: any): any {
  let servers: any[]
  if (serversOpts != null) {
    servers = serversOpts.map(({ url, description }: any) => ({
      url,
      description,
    }))
  } else {
    servers = Array.from(domains).map((domain) => ({ url: domain }))
  }
  return servers.length > 0 ? { servers } : {}
}

function parseTags(tagsObj: Record<string, any>): any {
  const tags = Object.entries(tagsObj).map(([name, description]) => ({
    name,
    description,
  }))
  return tags.length > 0 ? { tags } : {}
}

function descriptionParse(description: string): any {
  if (description == null) return { description }
  const splitDesc = description.split(/# postman-to-openapi/gi)
  if (splitDesc.length === 1) return { description }
  return {
    description: splitDesc[0].trim(),
    paramsMeta: parseMdTable(),
  }
}

function parseResponse(
  responses: any[],
  events: any[],
  responseHeaders: boolean,
): any {
  if (responses != null && Array.isArray(responses) && responses.length > 0) {
    return parseResponseFromExamples(responses, responseHeaders)
  } else {
    return { responses: parseResponseFromEvents(events) }
  }
}

function parseResponseFromEvents(events: any[] = []): any {
  let status = 200
  const test = events.filter((event) => event.listen === 'test')
  if (test.length > 0) {
    const script = test[0].script.exec.join()
    const result = script.match(
      /\.response\.code\)\.to\.eql\((\d{3})\)|\.to\.have\.status\((\d{3})\)/,
    )
    status =
      result?.[1] != null ? result[1] : result?.[2] != null ? result[2] : status
  }
  return {
    [status]: {
      description: 'Successful response',
      content: {
        'application/json': {},
      },
    },
  }
}

function parseResponseFromExamples(
  responses: any[],
  responseHeaders: boolean,
): any {
  const statusCodeMap = responses.reduce(
    (
      statusMap: any,
      {
        name,
        code,
        status: description,
        header,
        body,
        _postman_previewlanguage: language,
      }: any,
    ) => {
      if (statusMap[code]) {
        if (!statusMap[code].bodies[language]) {
          statusMap[code].bodies[language] = []
        }
        statusMap[code].bodies[language].push({ name, body })
      } else {
        statusMap[code] = {
          description,
          header,
          bodies: { [language]: [{ name, body }] },
        }
      }
      return statusMap
    },
    {},
  )
  const parsedResponses = Object.entries(statusCodeMap).reduce(
    (parsed: any, [status, { description, header, bodies }]: any) => {
      parsed[status] = {
        description,
        ...parseResponseHeaders(header, responseHeaders),
        ...parseContent(bodies),
      }
      return parsed
    },
    {},
  )
  return { responses: parsedResponses }
}

function parseContent(bodiesByLanguage: any): any {
  const contentObj = Object.entries(bodiesByLanguage).reduce(
    (content: any, [language, bodies]: any) => {
      if (language === 'json') {
        content['application/json'] = {
          schema: { type: 'object' },
          ...parseExamples(bodies, 'json'),
        }
      } else {
        content['text/plain'] = {
          schema: { type: 'string' },
          ...parseExamples(bodies, 'text'),
        }
      }
      return content
    },
    {},
  )
  return { content: contentObj }
}

function parseExamples(bodies: any[], language: string): any {
  if (Array.isArray(bodies) && bodies.length > 1) {
    return {
      examples: bodies.reduce(
        (ex: any, { name: summary, body }: any, i: number) => {
          ex[`example-${i}`] = {
            summary,
            value: safeSampleParse(body, summary, language),
          }
          return ex
        },
        {},
      ),
    }
  } else {
    const { body, name } = bodies[0]
    return {
      example: safeSampleParse(body, name, language),
    }
  }
}

function safeSampleParse(body: string, name: string, language: string): any {
  if (language === 'json') {
    const errors: any[] = []
    const parsedBody = parseJsonc(
      body == null || body.trim().length === 0 ? '{}' : body,
      errors,
    )
    if (errors.length > 0) {
      throw new Error('Error parsing response example "' + name + '"')
    }
    return parsedBody
  }
  return body
}

function parseResponseHeaders(
  headerArray: any[] | undefined,
  responseHeaders: boolean,
): any {
  if (!responseHeaders || !headerArray) {
    return {}
  }
  const headers = headerArray.reduce((acc: any, { key, value }: any) => {
    acc[key] = {
      schema: {
        type: inferType(value),
        example: value,
      },
    }
    return acc
  }, {})
  return Object.keys(headers).length > 0 ? { headers } : {}
}

function isRequired(text: string): boolean {
  return /\[required\]/gi.test(text)
}

const defaultParamInserter = (
  parameterMap: Map<string, any>,
  param: any,
): Map<string, any> => {
  if (!parameterMap.has(param.name)) {
    parameterMap.set(param.name, param)
  }
  return parameterMap
}

function calculateOperationId(
  mode: string,
  name: string,
  summary: string,
): any {
  let operationId
  switch (mode) {
    case 'off':
      break
    case 'auto':
      operationId = camelCase(summary)
      break
    case 'brackets': {
      const matches = name.match(/\[([^[\]]*)\]/)
      operationId = matches ? matches[1] : undefined
      break
    }
    default:
      break
  }
  return operationId ? { operationId } : {}
}

export default postmanToOpenApi
