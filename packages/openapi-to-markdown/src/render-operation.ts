import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { isObject } from '@scalar/helpers/object/is-object'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponseObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Heading, ListItem, PhrasingContent, RootContent } from 'mdast'

import type { DocumentExamples } from './document-examples'
import { describe, field, heading, inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'
import { renderEncoding, renderHeaders, renderResponseLinks } from './render-operation-details'
import type { SchemaRenderer } from './render-schema'
import { renderSecurity } from './render-security'

/** Dependencies shared by all sections of one prepared renderer. */
type RenderContext = {
  description: DescriptionParser
  schemas: SchemaRenderer
  examples?: DocumentExamples
  /** The heading level of the operation title: 1 on its own page, 3 inside a document. */
  level?: number
}

/** Parameter locations in reading order, with the section title for each. */
const parameterLocations: [string, string][] = [
  ['path', 'Path parameters'],
  ['query', 'Query parameters'],
  ['querystring', 'Query string'],
  ['header', 'Header parameters'],
  ['cookie', 'Cookie parameters'],
]

/** A short label for one media type, instead of a heading per content type. */
const contentType = (mediaType: string): RootContent =>
  paragraph(strong(text('Content type:')), text(' '), inlineCode(mediaType))

/**
 * Responses that only differ in status and description, such as a list of error statuses that all
 * return the same error schema, share one key. Anything else a response declares keeps it separate.
 */
const getResponseKey = (response: ResponseObject, ids: Map<object, number>): string | undefined => {
  if (Object.keys(response.headers ?? {}).length || Object.keys(response.links ?? {}).length) return undefined
  const content = Object.entries(response.content ?? {})
  if (!content.length) return undefined
  const parts: unknown[] = []
  for (const [mediaType, media] of content) {
    const schema = getResolvedRef(media.schema)
    if (!isObject(schema) || media.example !== undefined || media.examples || media.encoding) return undefined
    if (!ids.has(schema)) ids.set(schema, ids.size)
    // Reference siblings change the schema, so only a plain reference shares its target's identity.
    const siblings = isObject(media.schema) ? Object.keys(media.schema).filter((key) => !key.startsWith('$')) : []
    if (siblings.length) return undefined
    parts.push(mediaType, ids.get(schema))
  }
  return JSON.stringify(parts)
}

/** Render effective operation context without mutating the prepared document. */
export const renderOperation = async (
  document: OpenApiDocument,
  path: string,
  method: string,
  pathItem: PathItemObject,
  operation: OperationObject,
  webhook: boolean,
  { description, schemas, examples, level = 3 }: RenderContext,
): Promise<RootContent[]> => {
  const h = (offset: number): Heading['depth'] => Math.min(6, level + offset) as Heading['depth']
  const displayMethod = method === method.toLowerCase() && isHttpMethod(method) ? method.toUpperCase() : method
  const openapiVersion = document['x-original-oas-version'] ?? document.openapi
  const stability = operation['x-scalar-stability']
  const title =
    (operation.summary || `${displayMethod} ${path}`) +
    (stability ? ` (${stability})` : operation.deprecated ? ' ⚠️ Deprecated' : '')
  const metadata = [field('Method', inlineCode(displayMethod)), field(webhook ? 'Webhook' : 'Path', inlineCode(path))]
  if (operation.operationId) metadata.push(field('Operation ID', inlineCode(operation.operationId)))
  if (operation.tags) metadata.push(field('Tags', text(operation.tags.join(', '))))
  if (stability) metadata.push(field('Stability', text(stability)))
  const nodes: RootContent[] = [
    heading(h(0), text(title)),
    list(metadata),
    ...(await description(operation.description)),
  ]
  const servers = operation.servers ?? pathItem.servers ?? document.servers
  if (servers?.length) {
    nodes.push(heading(h(1), text('Effective servers')))
    const serverItems: ListItem[] = []
    for (const server of servers) {
      const blocks: ListItem['children'] = [
        paragraph(inlineCode(server.url)),
        ...((await description(server.description)) as ListItem['children']),
      ]
      const variables = Object.entries(server.variables ?? {})
      if (variables.length)
        blocks.push(
          list(variables.map(([name, variable]) => item(paragraph(text(`${name}: `), inlineCode(variable.default))))),
        )
      serverItems.push(item(...blocks))
    }
    nodes.push(list(serverItems))
  }
  nodes.push(
    ...(await renderSecurity(
      operation.security ?? document.security,
      document.components?.securitySchemes,
      description,
      h(1),
    )),
  )
  const parameters = new Map<string, ParameterObject>()
  for (const reference of [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]) {
    const parameter = getResolvedRef(reference, mergeSiblingReferences)
    if (parameter) parameters.set(`${parameter.in}:${parameter.name}`, parameter)
  }
  const locations = [
    ...parameterLocations,
    ...[...new Set([...parameters.values()].map((parameter) => parameter.in))]
      .filter((location) => !parameterLocations.some(([known]) => known === location))
      .map((location): [string, string] => [location, `Parameters in ${location}`]),
  ]
  for (const [location, sectionTitle] of locations) {
    const entries: ListItem[] = []
    for (const parameter of parameters.values()) {
      if (parameter.in !== location) continue
      entries.push(await renderParameter(parameter, { description, schemas, examples, openapiVersion, document }))
    }
    if (entries.length) nodes.push(heading(h(1), text(sectionTitle)), list(entries))
  }
  const body: RequestBodyObject | undefined = getResolvedRef(operation.requestBody, mergeSiblingReferences)
  if (body) {
    nodes.push(heading(h(1), text('Request body')), ...(await description(body.description)))
    if (typeof body.required === 'boolean')
      nodes.push(paragraph(strong(text('Required:')), text(' '), inlineCode(body.required)))
    for (const [mediaType, content] of Object.entries(body.content ?? {})) {
      nodes.push(contentType(mediaType))
      if (content.schema !== undefined) nodes.push(...schemas.render(content.schema))
      nodes.push(
        ...(await renderExamples(content, description, mediaType, 'write', openapiVersion, document.openapi, {
          linked: schemas.linked,
          examples,
        })),
      )
      nodes.push(
        ...(await renderEncoding(
          content.encoding,
          mediaType,
          description,
          schemas,
          openapiVersion,
          document.openapi,
          examples,
        )),
      )
    }
  }
  const responses = Object.entries(operation.responses ?? {}).flatMap(([status, reference]) => {
    const response: ResponseObject | undefined = getResolvedRef(reference, mergeSiblingReferences)
    return response ? [{ status, response }] : []
  })
  // Group responses that share everything but their status, in the order they first appear.
  const ids = new Map<object, number>()
  const groups = new Map<string, { status: string; response: ResponseObject }[]>()
  for (const entry of responses) {
    const key = getResponseKey(entry.response, ids) ?? `status:${entry.status}`
    groups.set(key, [...(groups.get(key) ?? []), entry])
  }
  if (responses.length) nodes.push(heading(h(1), text('Responses')))
  for (const group of groups.values()) {
    const { response } = group[0]!
    if (group.length > 1) {
      nodes.push(
        heading(h(2), text(group.map(({ status }) => status).join(', '))),
        list(
          group.map(({ status, response }) =>
            item(paragraph(inlineCode(status), ...(response.description ? [text(` ${response.description}`)] : []))),
          ),
        ),
      )
    } else {
      const { status } = group[0]!
      nodes.push(heading(h(2), text(`${status}${response.description ? ` ${response.description}` : ''}`)))
    }
    nodes.push(
      ...(await renderHeaders(response.headers, description, schemas, openapiVersion, document.openapi, examples)),
      ...(await renderResponseLinks(response.links, description)),
    )
    for (const [mediaType, content] of Object.entries(response.content ?? {})) {
      nodes.push(contentType(mediaType))
      if (content.schema !== undefined) nodes.push(...schemas.render(content.schema))
      nodes.push(
        ...(await renderExamples(content, description, mediaType, 'read', openapiVersion, document.openapi, {
          linked: schemas.linked,
          examples,
        })),
      )
    }
  }
  return nodes
}

/** One parameter as a list item: its name and type on one line, then its description and details. */
const renderParameter = async (
  parameter: ParameterObject,
  {
    description,
    schemas,
    examples,
    openapiVersion,
    document,
  }: {
    description: DescriptionParser
    schemas: SchemaRenderer
    examples?: DocumentExamples
    openapiVersion: string
    document: OpenApiDocument
  },
): Promise<ListItem> => {
  const flags = [parameter.required ? 'required' : '', parameter.deprecated ? 'deprecated' : ''].filter(Boolean)
  const title: PhrasingContent[] = [
    strong(inlineCode(parameter.name), ...(flags.length ? [text(` (${flags.join(', ')})`)] : [])),
  ]
  const schema = 'schema' in parameter ? parameter.schema : undefined
  const summary = schema === undefined ? [] : schemas.summarize(schema)
  const add = (label: string, value: unknown): void => {
    if (value !== undefined) summary.push(text(`${summary.length ? ', ' : ''}${label}: `), inlineCode(value))
  }
  if ('style' in parameter) add('style', parameter.style)
  if ('explode' in parameter && typeof parameter.explode === 'boolean') add('explode', parameter.explode)
  if (parameter.allowEmptyValue) add('allowEmptyValue', true)
  if ('allowReserved' in parameter && parameter.allowReserved) add('allowReserved', true)
  if (summary.length) title.push(text(': '), ...summary)
  const blocks: ListItem['children'] = [
    paragraph(...title),
    ...((await description(parameter.description)) as ListItem['children']),
  ]
  if (schema !== undefined) {
    // The schema's own description usually repeats the parameter's, so print it only when it differs.
    const schemaDescription = schemas.view(schema).description
    if (schemaDescription?.trim() !== parameter.description?.trim()) blocks.push(...describe(schemaDescription))
    blocks.push(...(schemas.render(schema, 0, [], { hideDetails: true }) as ListItem['children']))
  }
  if ('example' in parameter || 'examples' in parameter)
    blocks.push(
      ...((await renderExamples(
        { example: parameter.example, examples: parameter.examples },
        description,
        'application/json',
        'write',
        openapiVersion,
        document.openapi,
        { examples },
      )) as ListItem['children']),
    )
  for (const [mediaType, content] of Object.entries('content' in parameter ? (parameter.content ?? {}) : {})) {
    blocks.push(contentType(mediaType) as ListItem['children'][number])
    if (content.schema !== undefined) blocks.push(...(schemas.render(content.schema) as ListItem['children']))
    blocks.push(
      ...((await renderExamples(content, description, mediaType, 'write', openapiVersion, document.openapi, {
        linked: schemas.linked,
        examples,
      })) as ListItem['children']),
    )
  }
  return item(...blocks)
}
