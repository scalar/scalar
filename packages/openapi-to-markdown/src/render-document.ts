import {
  forEachPathItemOperation,
  getResolvedPathItem,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument, OperationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, Root, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import { field, heading, inlineCode, item, link, list, paragraph, strong, text } from './markdown-nodes'
import { createDescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'
import { renderOperation } from './render-operation'
import { createSchemaRenderer } from './render-schema'
import { renderSecurity } from './render-security'

const serializer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-' }).freeze()

/** Build Markdown directly, retaining caches only for this immutable document snapshot. */
export const createDocumentRenderer = (): ((document: OpenApiDocument) => Promise<string>) => {
  const descriptions = createDescriptionParser()
  const schemas = createSchemaRenderer()
  return async (document) => {
    const description = descriptions()
    const { info } = document
    const metadata = [
      field('OpenAPI Version', inlineCode(document.openapi)),
      field('API Version', inlineCode(info.version)),
    ]
    if (info.termsOfService) metadata.push(field('Terms of service', link(info.termsOfService, info.termsOfService)))
    if (info.contact) {
      const contact = [text(info.contact.name ?? '')]
      metadata.push(
        item(
          paragraph(
            strong(text('Contact:')),
            text(' '),
            ...contact,
            ...(info.contact.url ? [text(' '), link(info.contact.url, info.contact.url)] : []),
            ...(info.contact.email ? [text(' '), link(`mailto:${info.contact.email}`, info.contact.email)] : []),
          ),
        ),
      )
    }
    if (info.license)
      metadata.push(
        field('License', info.license.url ? link(info.license.url, info.license.name ?? '') : text(info.license.name)),
      )
    const nodes: RootContent[] = [
      heading(1, text(info.title)),
      list(metadata),
      ...(await description(info.description)),
    ]
    if (document.servers?.length) {
      nodes.push(heading(2, text('Servers')))
      const servers = document.servers.map((server) => {
        const nested: ListItem[] = []
        if (server.description) nested.push(field('Description', text(server.description)))
        const variables = Object.entries(server.variables ?? {})
        if (variables.length)
          nested.push(
            item(
              paragraph(strong(text('Variables:'))),
              list(
                variables.map(([name, variable]) =>
                  item(
                    paragraph(
                      inlineCode(name),
                      text(' (default: '),
                      inlineCode(variable.default),
                      text(`)${variable.description ? `: ${variable.description}` : ''}`),
                    ),
                  ),
                ),
              ),
            ),
          )
        const entry = field('URL', inlineCode(server.url))
        if (nested.length) entry.children.push(list(nested))
        return entry
      })
      nodes.push(list(servers))
    }
    nodes.push(...(await renderSecurity(document.security, document.components?.securitySchemes, description)))
    if (document.tags?.length) {
      nodes.push(heading(2, text('Tags')))
      for (const tag of document.tags) {
        nodes.push(heading(3, text(tag.name)), ...(await description(tag.description)))
        if (tag.externalDocs)
          nodes.push(paragraph(link(tag.externalDocs.url, tag.externalDocs.description ?? tag.externalDocs.url)))
      }
    }
    const sections: string[] = []
    const flush = (): void => {
      if (nodes.length) {
        const tree: Root = { type: 'root', children: nodes.splice(0) }
        sections.push(serializer.stringify(tree).trimEnd())
      }
    }
    flush()
    for (const group of [
      { title: 'Operations', paths: document.paths, webhook: false },
      { title: 'Webhooks', paths: document.webhooks, webhook: true },
    ]) {
      let hasOperations = false
      for (const [path, reference] of Object.entries(group.paths ?? {})) {
        const pathItem = getResolvedPathItem(reference)
        if (!pathItem) continue
        const entries: { method: string; operation: OperationObject }[] = []
        forEachPathItemOperation(reference, (method, operation) => {
          entries.push({ method, operation: getResolvedRef(operation, mergeSiblingReferences) })
        })
        for (const { method, operation } of entries) {
          if (!hasOperations) {
            nodes.push(heading(2, text(group.title)))
            hasOperations = true
          }
          nodes.push(
            ...(await renderOperation(document, path, method, pathItem, operation, group.webhook, {
              description,
              schemas,
            })),
          )
          flush()
        }
      }
    }
    const models = Object.entries(document.components?.schemas ?? {})
    if (models.length) nodes.push(heading(2, text('Schemas')))
    for (const [name, schema] of models) {
      const view = schemas.view(schema)
      nodes.push(
        heading(3, text(view.title ?? name)),
        list([
          view.type
            ? field('Type', inlineCode(Array.isArray(view.type) ? view.type.join(' | ') : view.type))
            : item(paragraph(strong(text('Type:')))),
        ]),
        ...(await description(view.description)),
        ...schemas.render(schema, 0, [], { hideDescription: true }),
      )
      if (view.type === 'object') nodes.push(...(await renderExamples({ schema }, description)))
      flush()
    }
    flush()
    return `${sections.join('\n\n')}\n`
  }
}
