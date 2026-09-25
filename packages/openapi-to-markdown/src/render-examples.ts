import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { RootContent } from 'mdast'

import { type ExampleSource, getMarkdownExamples } from './get-markdown-examples'
import { link, paragraph, strong, text } from './markdown-nodes'
import type { DescriptionParser } from './parse-description'

/** Render supplied examples before considering a schema-generated fallback. */
export const renderExamples = async (
  source: ExampleSource,
  description: DescriptionParser,
  mediaType = 'application/json',
  mode?: 'read' | 'write',
  openapiVersion = '3.2.0',
  // Schema metadata can be upgraded while example fields still follow the original version.
  schemaOpenapiVersion = openapiVersion,
): Promise<RootContent[]> => {
  const nodes: RootContent[] = []
  for (const example of getMarkdownExamples(source, mediaType, mode, openapiVersion, schemaOpenapiVersion)) {
    nodes.push(paragraph(strong(text(example.name ? `Example: ${example.name}` : 'Example:'))))
    if ('omitted' in example) {
      nodes.push(paragraph(text('[Generated example omitted because it is too large]')))
      continue
    }
    if (example.summary) nodes.push(paragraph(text(example.summary)))
    nodes.push(...(await description(example.description)))
    if ('error' in example) {
      nodes.push(paragraph(text(example.error)))
      continue
    }
    if ('externalValue' in example) {
      nodes.push(
        paragraph(strong(text('External value:')), text(' '), link(example.externalValue, example.externalValue)),
      )
      continue
    }
    if ('serializedValue' in example) {
      nodes.push({
        type: 'code',
        lang: isXmlMediaType(mediaType) ? 'xml' : mediaType.includes('json') ? 'json' : 'text',
        value: example.serializedValue,
      })
      continue
    }
    const xml = isXmlMediaType(mediaType)
    const value = 'dataValue' in example ? example.dataValue : example.value
    if (xml && !source.schema && 'value' in example && (value === null || typeof value !== 'object')) {
      nodes.push({ type: 'code', lang: 'xml', value: String(value) })
      continue
    }
    const result = xml
      ? getXmlBodyExample(source.schema as SchemaObject | undefined, example, {
          mode,
          openapiVersion: schemaOpenapiVersion,
        })
      : undefined
    if (xml && result?.xml === undefined) {
      nodes.push(paragraph(text('Unable to generate an XML example.')))
      continue
    }
    nodes.push({
      type: 'code',
      lang: xml ? 'xml' : 'json',
      value: result?.xml ?? JSON.stringify(value, null, 2) ?? '',
    })
  }
  return nodes
}
