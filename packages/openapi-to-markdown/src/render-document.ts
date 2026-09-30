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

import { anchor, createDocumentAnchors } from './document-anchors'
import { createDocumentExamples } from './document-examples'
import { field, heading, inlineCode, item, link, list, paragraph, strong, text } from './markdown-nodes'
import { type DescriptionParser, createDescriptionParser, expandDescriptions } from './parse-description'
import { renderExamples } from './render-examples'
import { type DocumentContext, renderOperation } from './render-operation'
import { type SchemaView, type ShownSchema, createSchemaRenderer } from './render-schema'
import { renderSecurity } from './render-security'
import type { OpenApiRenderOptions } from './select-document'

const serializer = unified()
  .use(remarkGfm)
  .use(remarkStringify, {
    bullet: '-',
    join: [
      (left, right, parent) => {
        if (!('spread' in parent)) return undefined
        // Inside a tight list item, content after a nested list would otherwise continue its last item.
        if (left.type === 'list' && right.type !== 'list') return 1
        // Code blocks in descriptions read better apart from the prose around them.
        if (left.type === 'code' || right.type === 'code') return 1
        return undefined
      },
    ],
  })
  .freeze()

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
  options?: OpenApiRenderOptions,
) => Promise<string>) => {
  const descriptions = createDescriptionParser()
  const schemaRenderer = createSchemaRenderer()
  return async (document, options = {}) => {
    const description = descriptions()
    const whole = [options.operation, options.webhook, options.model, options.tag, options.introduction].every(
      (selector) => selector === undefined,
    )
    const anchors = createDocumentAnchors()
    const examples = whole ? createDocumentExamples(anchors) : undefined
    const documentContext: DocumentContext | undefined = whole
      ? {
          anchors,
          servers: document.servers !== undefined ? anchors.get('context', 'global-servers') : undefined,
          authentication: document.security !== undefined ? anchors.get('context', 'global-authentication') : undefined,
          pathServers: new WeakMap(),
        }
      : undefined
    const destinations = whole
      ? new Map(
          Object.keys(document.components?.schemas ?? {}).map((name) => [
            name,
            `#${encodeURIComponent(anchors.get('schema', name))}`,
          ]),
        )
      : undefined
    // Each page expands a shared schema once, then refers back to it.
    const schemas = schemaRenderer.forDocument(document.components?.schemas, options, destinations)
    const openapiVersion = document['x-original-oas-version'] ?? document.openapi
    // A page for one operation, webhook or model starts with that item, not with the API.
    const single = options.operation !== undefined || options.webhook !== undefined || options.model !== undefined
    const nodes: RootContent[] = []
    const sections: string[] = []
    const flush = async (): Promise<void> => {
      if (!nodes.length) return
      const children = nodes.splice(0)
      await expandDescriptions(children, description)
      sections.push(serializer.stringify({ type: 'root', children } satisfies Root).trimEnd())
    }
    if (!single) {
      const { info } = document
      const metadata = [field('OpenAPI Version', inlineCode(document.openapi))]
      if (info.version) metadata.push(field('API Version', inlineCode(info.version)))
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
          field(
            'License',
            info.license.url ? link(info.license.url, info.license.name ?? '') : text(info.license.name),
          ),
        )
      nodes.push(heading(1, text(info.title)), list(metadata), ...(await description(info.description)))
      if (document.servers?.length || (whole && document.servers !== undefined)) {
        if (documentContext?.servers) nodes.push(anchor(documentContext.servers))
        nodes.push(heading(2, text('Servers')))
        const effectiveServers: NonNullable<OpenApiDocument['servers']> = document.servers?.length
          ? document.servers
          : [{ url: '/' }]
        const servers = effectiveServers.map((server) => {
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
                        text(')'),
                        ...(whole && variable.enum?.length
                          ? [text(', possible values: '), inlineCode(variable.enum.join(', '))]
                          : []),
                        text(variable.description ? `: ${variable.description}` : ''),
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
      if (documentContext?.authentication) nodes.push(anchor(documentContext.authentication))
      nodes.push(...(await renderSecurity(document.security, document.components?.securitySchemes, description, 2)))
      if (document.tags?.length) {
        nodes.push(heading(2, text('Tags')))
        for (const tag of document.tags) {
          nodes.push(heading(3, text(tag.name)), ...(await description(tag.description)))
          if (tag.externalDocs)
            nodes.push(paragraph(link(tag.externalDocs.url, tag.externalDocs.description ?? tag.externalDocs.url)))
        }
      }
      await flush()
    }
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
          entries.push({
            method,
            operation: getResolvedRef(operation, mergeSiblingReferences),
          })
        })
        for (const { method, operation } of entries) {
          if (!hasOperations && !single) nodes.push(heading(2, text(group.title)))
          hasOperations = true
          schemas.beginSection()
          nodes.push(
            ...(await renderOperation(document, path, method, pathItem, operation, group.webhook, {
              description,
              schemas,
              examples,
              documentContext,
              level: single ? 1 : 3,
            })),
          )
          await flush()
        }
      }
    }
    // A model page renders its own model first, as the page title.
    const models = Object.entries(document.components?.schemas ?? {}).sort(
      ([a], [b]) => Number(b === options.model) - Number(a === options.model),
    )
    const renderModel = async (name: string, schema: (typeof models)[number][1], level: 1 | 3): Promise<void> => {
      const view = schemas.view(schema)
      const summary = schemas.summarize(schema)
      if (whole) nodes.push(anchor(anchors.get('schema', name)))
      nodes.push(heading(level, text(view.title ?? name)))
      if (summary.length) nodes.push(paragraph(strong(text('Type:')), text('\u00a0'), ...summary))
      nodes.push(
        ...(await description(view.description)),
        ...schemas.render(schema, 0, [], { hideDetails: true, name }),
      )
      if (view.type === 'object') {
        // A model page's own schema is bounded, so it gets a generated example even in linked mode.
        const own = name === options.model
        nodes.push(
          ...(await renderExamples(
            { schema: own ? schemas.exampleSchema(schema) : schema },
            description,
            'application/json',
            undefined,
            openapiVersion,
            document.openapi,
            {
              linked: schemas.linked && !own,
              quiet: schemas.linked,
              examples,
            },
          )),
        )
      }
      await flush()
    }
    const selected = models.find(([name]) => name === options.model)
    if (selected) {
      schemas.beginSection()
      await renderModel(selected[0], selected[1], 1)
    }
    const dependencies = models.filter(([name]) => name !== options.model)
    if (dependencies.length) nodes.push(heading(2, text('Schemas')))
    // Models the page already expanded cost one line each, grouped into a single list.
    const shownAbove: ListItem[] = []
    const flushShownAbove = (): void => {
      if (shownAbove.length) nodes.push(list(shownAbove.splice(0)))
    }
    for (const [name, schema] of dependencies) {
      schemas.beginSection()
      const view = schemas.view(schema)
      const previous = schemas.shownAs(schema)
      // A generated example only restates the schema, but an authored one is not printed above.
      const authored =
        isObject(view.schema) &&
        (view.schema.example !== undefined || (Array.isArray(view.schema.examples) && view.schema.examples.length > 0))
      if (!whole && previous && !(view.type === 'object' && authored)) {
        shownAbove.push(await renderShownModel(name, view, previous, description))
        continue
      }
      flushShownAbove()
      await renderModel(name, schema, 3)
    }
    flushShownAbove()
    await flush()
    return `${sections.join('\n\n')}\n`
  }
}
