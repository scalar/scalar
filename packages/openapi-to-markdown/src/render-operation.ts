import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponseObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, RootContent } from 'mdast'

import { field, heading, inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'
import { renderEncoding, renderHeaders, renderResponseLinks } from './render-operation-details'
import type { SchemaRenderer } from './render-schema'
import { renderSecurity } from './render-security'

/** Dependencies shared by all sections of one prepared renderer. */
type RenderContext = {
  description: DescriptionParser
  schemas: SchemaRenderer
}

/** Render effective operation context without mutating the prepared document. */
export const renderOperation = async (
  document: OpenApiDocument,
  path: string,
  method: string,
  pathItem: PathItemObject,
  operation: OperationObject,
  webhook: boolean,
  { description, schemas }: RenderContext,
): Promise<RootContent[]> => {
  const stability = operation['x-scalar-stability']
  const title =
    (operation.summary || `${method.toUpperCase()} ${path}`) +
    (stability ? ` (${stability})` : operation.deprecated ? ' ⚠️ Deprecated' : '')
  const metadata = [
    field('Method', inlineCode(method.toUpperCase())),
    field(webhook ? 'Webhook' : 'Path', inlineCode(path)),
  ]
  if (operation.operationId) metadata.push(field('Operation ID', inlineCode(operation.operationId)))
  if (operation.tags) metadata.push(field('Tags', text(operation.tags.join(', '))))
  if (stability) metadata.push(field('Stability', text(stability)))
  const nodes: RootContent[] = [heading(3, text(title)), list(metadata), ...(await description(operation.description))]
  const servers = operation.servers ?? pathItem.servers ?? document.servers
  if (servers?.length) {
    nodes.push(heading(4, text('Effective servers')))
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
    )),
  )
  const parameters = new Map<string, ParameterObject>()
  for (const reference of [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])]) {
    const parameter = getResolvedRef(reference, mergeSiblingReferences)
    if (parameter) parameters.set(`${parameter.in}:${parameter.name}`, parameter)
  }
  if (parameters.size) nodes.push(heading(4, text('Parameters')))
  for (const parameter of parameters.values()) {
    nodes.push(
      heading(
        5,
        inlineCode(parameter.name),
        text(`${parameter.required ? ' required' : ''}${parameter.deprecated ? ' deprecated' : ''}`),
      ),
    )
    const fields = [field('In', inlineCode(parameter.in))]
    if ('style' in parameter && parameter.style) fields.push(field('Style', inlineCode(parameter.style)))
    if ('explode' in parameter && typeof parameter.explode === 'boolean')
      fields.push(field('Explode', inlineCode(parameter.explode)))
    if (parameter.allowEmptyValue) fields.push(field('Allow Empty Value', text('true')))
    if ('allowReserved' in parameter && parameter.allowReserved) fields.push(field('Allow Reserved', text('true')))
    nodes.push(list(fields), ...(await description(parameter.description)))
    if ('schema' in parameter && parameter.schema !== undefined) nodes.push(...schemas.render(parameter.schema))
    if ('example' in parameter || 'examples' in parameter)
      nodes.push(
        ...(await renderExamples(
          { example: parameter.example, examples: parameter.examples },
          description,
          'application/json',
          'write',
        )),
      )
    for (const [mediaType, content] of Object.entries('content' in parameter ? (parameter.content ?? {}) : {})) {
      nodes.push(heading(6, text(`Content-Type: ${mediaType}`)))
      if (content.schema !== undefined) nodes.push(...schemas.render(content.schema))
      nodes.push(...(await renderExamples(content, description, mediaType, 'write')))
    }
  }
  const body: RequestBodyObject | undefined = getResolvedRef(operation.requestBody, mergeSiblingReferences)
  if (body) {
    nodes.push(heading(4, text('Request Body')), ...(await description(body.description)))
    if (typeof body.required === 'boolean')
      nodes.push(paragraph(strong(text('Required:')), text(' '), inlineCode(body.required)))
    for (const [mediaType, content] of Object.entries(body.content ?? {})) {
      nodes.push(heading(5, text(`Content-Type: ${mediaType}`)))
      if (content.schema !== undefined) nodes.push(...schemas.render(content.schema))
      nodes.push(...(await renderExamples(content, description, mediaType, 'write')))
      nodes.push(...(await renderEncoding(content.encoding, mediaType, description, schemas)))
    }
  }
  const responses = Object.entries(operation.responses ?? {}).flatMap(([status, reference]) => {
    const response: ResponseObject | undefined = getResolvedRef(reference, mergeSiblingReferences)
    return response ? [{ status, response }] : []
  })
  if (responses.length) nodes.push(heading(4, text('Responses')))
  for (const { status, response } of responses) {
    nodes.push(heading(5, text(`Status: ${status}${response.description ? ` ${response.description}` : ''}`)))
    nodes.push(
      ...(await renderHeaders(response.headers, description, schemas)),
      ...(await renderResponseLinks(response.links, description)),
    )
    for (const [mediaType, content] of Object.entries(response.content ?? {})) {
      nodes.push(heading(6, text(`Content-Type: ${mediaType}`)))
      if (content.schema !== undefined) nodes.push(...schemas.render(content.schema))
      nodes.push(...(await renderExamples(content, description, mediaType, 'read')))
    }
  }
  return nodes
}
