import {
  calculateOperationId,
  compileInfo,
  parseExternalDocs,
  parseServers,
  parseTags,
} from './utils/infoAndMetaHelpers'
import { parseMdTable } from './utils/mdUtils'
import {
  parseAuth,
  parseOperationAuth,
  parseParameters,
} from './utils/parameterAndAuthHelpers'
import { parseBody } from './utils/requestAndBodyHelpers'
import { parseResponse } from './utils/responseHelpers'
import { calculateDomains, calculatePath, scrapeURL } from './utils/urlHelpers'

type ConvertOptions = {
  info?: Record<string, any>
  defaultTag?: string
  pathDepth?: number
  auth?: any
  servers?: any[]
  externalDocs?: Record<string, any>
  folders?: Record<string, any>
  responseHeaders?: boolean
  additionalVars?: Record<string, any>
  disabledParams?: {
    includeQuery?: boolean
    includeHeader?: boolean
  }
  operationId?: string
}

/**
 * Converts Postman collection JSON to OpenAPI 3.0 specification.
 */
export async function convert(
  input: string,
  options: ConvertOptions = {},
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
    disabledParams = { includeQuery: false, includeHeader: false },
    operationId = 'off',
  } = options

  const _postmanJson = JSON.parse(input)
  const postmanJson = _postmanJson.collection || _postmanJson
  const { item: items = [], variable = [] } = postmanJson

  const paths: Record<string, any> = {}
  const domains = new Set<string>()
  const tags: Record<string, string> = {}
  const securitySchemes: Record<string, any> = {}

  const flattenedItems = flattenItems(items, '', folders, defaultTag, tags)

  flattenedItems.forEach((element) => {
    if (element != null) {
      const request = element.request || {}
      const name = element.name
      const tag = element.tag || defaultTag
      const events = element.event
      const response = element.response
      const url = request.url
      const method = request.method
      const body = request.body
      const rawDesc = request.description
      const header = request.header || []
      const auth = request.auth

      // Add check for undefined method
      if (!method) {
        console.warn(
          `Skipping element "${name || 'Unnamed'}": No method defined.`,
        )
        return // Skip processing this element
      }

      const { path, query, protocol, host, port, valid, pathVars } =
        scrapeURL(url)

      if (valid && protocol && path) {
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
  })

  const openApi = {
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

// Helper Functions

function flattenItems(
  items: any[],
  parentTag: string = '',
  folders: Record<string, any> = {},
  defaultTag: string,
  tags: Record<string, string>,
): any[] {
  const result: any[] = []
  items.forEach((item) => {
    if (item.item) {
      const tag = calculateFolderTag(
        { tag: parentTag, name: item.name },
        folders,
      )
      if (item.description) {
        tags[tag] = item.description
      }
      result.push(...flattenItems(item.item, tag, folders, defaultTag, tags))
    } else {
      const tag = parentTag || defaultTag
      item.tag = tag
      result.push(item)
    }
  })
  return result
}

function calculateFolderTag(
  { tag, name }: { tag: string; name: string },
  {
    separator = ' > ',
    concat = true,
  }: { separator?: string; concat?: boolean },
): string {
  return tag && concat ? `${tag}${separator}${name}` : name
}

function descriptionParse(description: any): {
  description?: string
  paramsMeta?: any
} {
  // Ensure description is a string
  if (typeof description !== 'string') {
    return { description }
  }

  const splitDesc = description.split(/# postman-to-openapi/gi)
  if (splitDesc.length === 1) return { description }
  return {
    description: splitDesc[0].trim(),
    paramsMeta: parseMdTable(splitDesc[1]),
  }
}
