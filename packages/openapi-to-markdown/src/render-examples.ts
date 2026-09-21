import { json2xml } from '@scalar/helpers/file/json2xml'
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
): Promise<RootContent[]> => {
  const nodes: RootContent[] = []
  for (const example of getMarkdownExamples(source, mediaType, mode)) {
    nodes.push(paragraph(strong(text(example.name ? `Example: ${example.name}` : 'Example:'))))
    if (example.summary) nodes.push(paragraph(text(example.summary)))
    nodes.push(...(await description(example.description)))
    if ('externalValue' in example) {
      nodes.push(
        paragraph(strong(text('External value:')), text(' '), link(example.externalValue, example.externalValue)),
      )
      continue
    }
    const xml = mediaType.includes('xml')
    nodes.push({
      type: 'code',
      lang: xml ? 'xml' : 'json',
      // XML strings are already serialized; primitives must not become object keys.
      value: xml
        ? example.value !== null && typeof example.value === 'object'
          ? json2xml(example.value)
          : String(example.value)
        : (JSON.stringify(example.value, null, 2) ?? ''),
    })
  }
  return nodes
}
