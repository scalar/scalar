import { createDescriptionParser, expandDescriptions } from '@scalar/openapi-to-markdown/markdown'
import type { Root } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import { object, own, select } from './document'
import { createContentRenderer } from './render-content'
import type { AsyncApiMarkdownRenderer } from './types'

const serializer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-' }).freeze()

/** Each render owns its selection, schema expansion state and description reference namespace. */
export const createRenderer = (document: Record<string, unknown>): AsyncApiMarkdownRenderer => {
  const descriptions = createDescriptionParser()
  return {
    render: async (options = {}) => {
      const selection = select(document, options)
      const { blocks, introduction, channel, operation, message, model } = createContentRenderer(document)
      if (selection === 'introduction' || selection === undefined) {
        introduction()
      }
      if (selection && selection !== 'introduction') {
        if (selection.kind === 'channel') {
          channel(selection.name, selection.value, 1)
        } else if (selection.kind === 'operation') {
          operation(selection.name, selection.value, 1, true)
        } else if (selection.kind === 'message') {
          message(selection.name, selection.value, 1)
        } else {
          model(selection.name, selection.value, 1)
        }
      } else if (selection === undefined) {
        for (const [name, value] of Object.entries(object(document.channels))) {
          channel(name, value, 2)
        }
        for (const [name, value] of Object.entries(object(own(document.components, 'messages')))) {
          message(name, value, 2)
        }
        for (const [name, value] of Object.entries(object(own(document.components, 'schemas')))) {
          model(`Schema: ${name}`, value, 2)
        }
      }
      await expandDescriptions(blocks, descriptions())
      return serializer.stringify({ type: 'root', children: blocks } satisfies Root)
    },
  }
}
