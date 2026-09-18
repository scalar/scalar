import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type {
  MediaTypeObject,
  OpenApiDocument,
  OperationObject,
  ParameterObject,
  PathItemObject,
  RequestBodyObject,
  ResponseObject,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, RootContent } from 'mdast'

import { field, heading, inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'
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
    if ('schema' in parameter && parameter.schema) nodes.push(...schemas.render(parameter.schema))
    for (const [mediaType, content] of Object.entries('content' in parameter ? (parameter.content ?? {}) : {})) {
      nodes.push(heading(6, text(`Content-Type: ${mediaType}`)))
      if (content.schema) nodes.push(...schemas.render(content.schema))
    }
  }
  const renderMediaExample = (content: MediaTypeObject, mediaType: string, mode: 'read' | 'write'): RootContent[] => {
    if (isXmlMediaType(mediaType)) {
      const example =
        content.example !== undefined
          ? { value: content.example }
          : getResolvedRef(Object.values(content.examples ?? {})[0])
      // XML mapping needs the reference wrapper and its target as separate layers.
      const result = getXmlBodyExample(content.schema as SchemaObject | undefined, example, {
        mode,
        openapiVersion: document.openapi,
      })
      if (!content.schema && !example) return []
      return [
        paragraph(strong(text('Example:'))),
        result.xml === undefined
          ? paragraph(text('Unable to generate an XML example.'))
          : { type: 'code', lang: 'xml', value: result.xml },
      ]
    }
    return content.schema ? [paragraph(strong(text('Example:'))), schemas.example(content.schema)] : []
  }
  const body: RequestBodyObject | undefined = getResolvedRef(operation.requestBody, mergeSiblingReferences)
  if (body?.content) {
    nodes.push(heading(4, text('Request Body')), ...(await description(body.description)))
    if (body.required) nodes.push(paragraph(strong(text('Required:')), text(' true')))
    for (const [mediaType, content] of Object.entries(body.content)) {
      nodes.push(heading(5, text(`Content-Type: ${mediaType}`)))
      if (content.schema) nodes.push(...schemas.render(content.schema))
      nodes.push(...renderMediaExample(content, mediaType, 'write'))
    }
  }
  const responses = Object.entries(operation.responses ?? {}).flatMap(([status, reference]) => {
    const response: ResponseObject | undefined = getResolvedRef(reference, mergeSiblingReferences)
    return response ? [{ status, response }] : []
  })
  if (responses.length) nodes.push(heading(4, text('Responses')))
  for (const { status, response } of responses) {
    nodes.push(heading(5, text(`Status: ${status}${response.description ? ` ${response.description}` : ''}`)))
    for (const [mediaType, content] of Object.entries(response.content ?? {})) {
      nodes.push(heading(6, text(`Content-Type: ${mediaType}`)))
      if (content.schema) nodes.push(...schemas.render(content.schema))
      nodes.push(...renderMediaExample(content, mediaType, 'read'))
    }
  }
  return nodes
}
