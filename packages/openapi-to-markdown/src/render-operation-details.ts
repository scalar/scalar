import { getResolvedRef, mergeSiblingReferences } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { EncodingObject, ResponseObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { ListItem, RootContent } from 'mdast'

import { inlineCode, item, list, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'
import { renderExamples } from './render-examples'
import type { SchemaRenderer } from './render-schema'

/** Render response or multipart headers, whose names come from their containing map. */
export const renderHeaders = async (
  headers: ResponseObject['headers'],
  description: DescriptionParser,
  schemas: SchemaRenderer,
): Promise<RootContent[]> => {
  const entries: ListItem[] = []
  for (const [name, reference] of Object.entries(headers ?? {})) {
    // OpenAPI reserves Content-Type for the media type map / encoding field.
    if (name.toLowerCase() === 'content-type') continue
    if (!getResolvedRef(reference)) continue
    const header = getResolvedRef(reference, mergeSiblingReferences)
    const blocks: ListItem['children'] = [
      paragraph(strong(inlineCode(name)), text(header.required ? ' (required)' : '')),
      ...((await description(header.description)) as ListItem['children']),
    ]
    if ('schema' in header && header.schema !== undefined)
      blocks.push(...(schemas.render(header.schema) as ListItem['children']))
    if ('example' in header || 'examples' in header) {
      blocks.push(
        ...((await renderExamples(
          { example: header.example, examples: header.examples },
          description,
        )) as ListItem['children']),
      )
    }
    for (const [mediaType, content] of Object.entries('content' in header ? (header.content ?? {}) : {})) {
      blocks.push(paragraph(strong(text('Content-Type:')), text(` ${mediaType}`)))
      if (content.schema !== undefined) blocks.push(...(schemas.render(content.schema) as ListItem['children']))
      blocks.push(...((await renderExamples(content, description, mediaType)) as ListItem['children']))
    }
    entries.push(item(...blocks))
  }
  return entries.length ? [paragraph(strong(text('Headers:'))), list(entries)] : []
}

/** Preserve explicit encoding settings, including false flags and part headers. */
export const renderEncoding = async (
  encoding: Record<string, EncodingObject> | undefined,
  mediaType: string,
  description: DescriptionParser,
  schemas: SchemaRenderer,
): Promise<RootContent[]> => {
  const multipart = mediaType.startsWith('multipart/')
  if (!multipart && mediaType !== 'application/x-www-form-urlencoded') return []
  const entries: ListItem[] = []
  for (const [name, entry] of Object.entries(encoding ?? {})) {
    const fields: ListItem[] = []
    for (const [key, label] of [
      ['contentType', 'Content-Type'],
      ['style', 'Style'],
      ['explode', 'Explode'],
      ['allowReserved', 'Allow reserved'],
    ] as const) {
      if (entry[key] !== undefined) fields.push(item(paragraph(text(`${label}: `), inlineCode(entry[key]))))
    }
    const blocks: ListItem['children'] = [paragraph(strong(inlineCode(name)))]
    if (fields.length) blocks.push(list(fields))
    if (multipart) blocks.push(...((await renderHeaders(entry.headers, description, schemas)) as ListItem['children']))
    entries.push(item(...blocks))
  }
  return entries.length ? [paragraph(strong(text('Encoding:'))), list(entries)] : []
}

const formatValue = (value: unknown): string => (typeof value === 'string' ? value : (JSON.stringify(value) ?? ''))

/** Render response link expressions as literal values, without evaluating them. */
export const renderResponseLinks = async (
  links: ResponseObject['links'],
  description: DescriptionParser,
): Promise<RootContent[]> => {
  const entries: ListItem[] = []
  for (const [name, reference] of Object.entries(links ?? {})) {
    if (!getResolvedRef(reference)) continue
    const link = getResolvedRef(reference, mergeSiblingReferences)
    const blocks: ListItem['children'] = [
      paragraph(strong(text(name))),
      ...((await description(link.description)) as ListItem['children']),
    ]
    if (link.operationId) blocks.push(paragraph(strong(text('Operation ID:')), text(' '), inlineCode(link.operationId)))
    if (link.operationRef)
      blocks.push(paragraph(strong(text('Operation reference:')), text(' '), inlineCode(link.operationRef)))
    const parameters = Object.entries(link.parameters ?? {})
    if (parameters.length)
      blocks.push(
        list(
          parameters.map(([name, value]) =>
            item(paragraph(strong(text(`${name}:`)), text(' '), inlineCode(formatValue(value)))),
          ),
        ),
      )
    if (link.requestBody !== undefined)
      blocks.push(paragraph(strong(text('Request body:')), text(' '), inlineCode(formatValue(link.requestBody))))
    if (link.server) blocks.push(paragraph(strong(text('Server:')), text(' '), inlineCode(link.server.url)))
    entries.push(item(...blocks))
  }
  return entries.length ? [paragraph(strong(text('Links:'))), list(entries)] : []
}
