import { isObject } from '@scalar/helpers/object/is-object'
import {
  forEachPathItemOperation,
  getResolvedPathItem,
} from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument, OperationObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, PhrasingContent, Root, RootContent } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import { field, heading, inlineCode, item, link, list, paragraph, strong, text } from './markdown-nodes'
import { type DescriptionParser, createDescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'
import { renderOperation } from './render-operation'
import { type SchemaView, type ShownSchema, createSchemaRenderer } from './render-schema'
import { renderSecurity } from './render-security'
import type { SchemaReferenceOptions } from './select-document'

const serializer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-' }).freeze()

/**
 * Refer to a model that an operation or an earlier model on the same page already expanded.
 * Keep what that expansion did not print: a title, and a description that a reference sibling replaced.
 */
const renderShownModel = async (
  name: string,
  view: SchemaView,
  previous: ShownSchema,
  description: DescriptionParser,
): Promise<ListItem> => {
  const label: PhrasingContent[] =
    view.title && view.title !== name
      ? [strong(text(view.title)), text(' ('), inlineCode(name), text(')')]
      : [inlineCode(name)]
  label.push(text(' — shown above'))
  if (previous.name !== name) label.push(text(' as '), inlineCode(previous.name))
  label.push(text('.'))
  const blocks: ListItem['children'] = [paragraph(...label)]
  if (view.description && view.description !== previous.description)
    blocks.push(...((await description(view.description)) as ListItem['children']))
  return item(...blocks)
}

/** Build Markdown directly, retaining caches only for this immutable document snapshot. */
export const createDocumentRenderer = (): ((
  document: OpenApiDocument,
  options?: SchemaReferenceOptions & { model?: string },
) => Promise<string>) => {
  const descriptions = createDescriptionParser()
  const schemaRenderer = createSchemaRenderer()
  return async (document, options) => {
    const description = descriptions()
    // Each page expands a shared schema once, then refers back to it.
    const schemas = schemaRenderer.forDocument(document.components?.schemas, options)
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
          schemas.beginSection()
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
    // Models the page already expanded cost one line each, grouped into a single list.
    const shownAbove: ListItem[] = []
    const flushShownAbove = (): void => {
      if (shownAbove.length) nodes.push(list(shownAbove.splice(0)))
    }
    for (const [name, schema] of models) {
      schemas.beginSection()
      const view = schemas.view(schema)
      const previous = schemas.shownAs(schema)
      // A generated example only restates the schema, but an authored one is not printed above.
      const authored =
        isObject(view.schema) &&
        (view.schema.example !== undefined || (Array.isArray(view.schema.examples) && view.schema.examples.length > 0))
      // A model page always gives the selected model its own section, even if a dependency expanded it first.
      if (previous && name !== options?.model && !(view.type === 'object' && authored)) {
        shownAbove.push(await renderShownModel(name, view, previous, description))
        continue
      }
      flushShownAbove()
      nodes.push(
        heading(3, text(view.title ?? name)),
        list([
          view.type
            ? field('Type', inlineCode(Array.isArray(view.type) ? view.type.join(' | ') : view.type))
            : item(paragraph(strong(text('Type:')))),
        ]),
        ...(await description(view.description)),
        ...schemas.render(schema, 0, [], { hideDescription: true, name }),
      )
      if (view.type === 'object')
        nodes.push(
          ...(await renderExamples(
            { schema },
            description,
            'application/json',
            undefined,
            document['x-original-oas-version'] ?? document.openapi,
            document.openapi,
            schemas.linked,
          )),
        )
      flush()
    }
    flushShownAbove()
    flush()
    return `${sections.join('\n\n')}\n`
  }
}
