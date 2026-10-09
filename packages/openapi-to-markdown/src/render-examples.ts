import { isXmlMediaType } from '@scalar/helpers/http/is-xml-media-type'
import { getXmlBodyExample } from '@scalar/workspace-store/request-example'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import type { Code, RootContent } from 'mdast'

import { anchor } from './document-anchors'
import type { DocumentExamples } from './document-examples'
import { type ExampleSource, getMarkdownExamples } from './get-markdown-examples'
import { emphasis, link, paragraph, strong, text } from './markdown-nodes'
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
  {
    linked = false,
    quiet = linked,
    examples,
  }: {
    /** Use only authored examples, since generating one would expand every linked schema. */
    linked?: boolean
    /** Leave out an example that is too large to generate, instead of noting it. */
    quiet?: boolean
    /** A whole document shares generation and links to identical generated examples. */
    examples?: DocumentExamples
  } = {},
): Promise<RootContent[]> => {
  const nodes: RootContent[] = []
  const values = (examples?.get ?? getMarkdownExamples)(
    source,
    mediaType,
    mode,
    openapiVersion,
    schemaOpenapiVersion,
    linked,
  )
  for (const example of values) {
    if ('omitted' in example && quiet) {
      continue
    }
    const start = nodes.length
    const generated = examples && example.generated
    const exampleLabel = example.name ? `Example: ${example.name}` : 'Example:'
    nodes.push(paragraph(strong(text(generated ? 'Generated example:' : exampleLabel))))
    const addCode = (code: Code): void => {
      if (generated) {
        const scope = JSON.stringify([mediaType, mode, openapiVersion, schemaOpenapiVersion, code.lang])
        const destination = examples.show(source, scope, code)
        if (destination.previous) {
          nodes.splice(start, nodes.length - start, paragraph(link(`#${destination.id}`, 'Generated example')))
          return
        }
        nodes.splice(start, 0, anchor(destination.id))
      }
      nodes.push(code)
    }
    if ('omitted' in example) {
      nodes.push(paragraph(emphasis(text('Generated example omitted because it is too large.'))))
      continue
    }
    if (example.summary) {
      nodes.push(paragraph(text(example.summary)))
    }
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
      const textLanguage = mediaType.includes('json') ? 'json' : 'text'
      addCode({
        type: 'code',
        lang: isXmlMediaType(mediaType) ? 'xml' : textLanguage,
        value: example.serializedValue,
      })
      continue
    }
    const xml = isXmlMediaType(mediaType)
    const value = 'dataValue' in example ? example.dataValue : example.value
    if (xml && !source.schema && 'value' in example && (value === null || typeof value !== 'object')) {
      addCode({ type: 'code', lang: 'xml', value: String(value) })
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
    addCode({
      type: 'code',
      lang: xml ? 'xml' : 'json',
      value: result?.xml ?? JSON.stringify(value, null, 2) ?? '',
    })
  }
  return nodes
}
