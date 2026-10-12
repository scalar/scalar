import { getRaw } from '@scalar/json-magic/magic-proxy'
import {
  anchor,
  createDescriptionParser,
  createDocumentAnchors,
  describe,
  expandDescriptions,
  heading,
  item,
  link,
  list,
  paragraph,
  text,
} from '@scalar/openapi-to-markdown/markdown'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'
import type { Root } from 'mdast'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import { object, own, select, string } from './document'
import { createContentRenderer } from './render-content'
import { createSchemaRegistry } from './schema-references'
import { createSchemaView } from './schema-view'
import type { AsyncApiMarkdownRenderer } from './types'

const serializer = unified().use(remarkGfm).use(remarkStringify, { bullet: '-' }).freeze()

/** Each render owns its selection, schema expansion state and description reference namespace. */
export const createRenderer = (document: Record<string, unknown>): AsyncApiMarkdownRenderer => {
  const descriptions = createDescriptionParser()
  const registry = createSchemaRegistry(document)
  const view = createSchemaView()
  return {
    render: async (options = {}) => {
      const selection = select(document, options)
      const { blocks, introduction, channel, operation, message, model, finish } = createContentRenderer(
        document,
        registry.forPage(options, selection === undefined),
        view,
        options.schemaReferences?.mode === 'linked',
        typeof selection === 'object' && selection.kind === 'model',
      )
      if (selection === 'introduction' || selection === undefined) {
        introduction()
      }
      if (selection && selection !== 'introduction') {
        if (selection.kind === 'tag') {
          const tagged = (input: unknown): boolean => {
            const value = object(input)
            const merged = resolveTraits(value, Array.isArray(value.traits) ? value.traits.map(object) : [])
            return Array.isArray(merged.tags) && merged.tags.some((tag) => object(tag).name === selection.name)
          }
          const infoTags = object(document.info).tags
          const tag = Array.isArray(infoTags) ? infoTags.find((tag) => object(tag).name === selection.name) : undefined
          blocks.push(heading(1, text(selection.name)), ...describe(object(tag).description))
          const external = object(object(tag).externalDocs)
          if (typeof external.url === 'string') {
            blocks.push(paragraph(link(external.url, string(external.description) || 'External documentation')))
          }
          const shown = new Set<unknown>()
          let matched = tag !== undefined
          for (const [name, value] of Object.entries(object(document.channels))) {
            if (tagged(value)) {
              channel(name, value, 2)
              shown.add(getRaw(object(value)))
              matched = true
            }
          }
          for (const [name, value] of Object.entries(object(document.operations))) {
            if (tagged(value) && !shown.has(getRaw(object(object(value).channel)))) {
              operation(name, value, 2, true)
              matched = true
            }
          }
          for (const [name, value] of Object.entries(object(own(document.components, 'messages')))) {
            if (tagged(value)) {
              message(name, value, 2)
              matched = true
            }
          }
          for (const [channelName, value] of Object.entries(object(document.channels))) {
            if (!shown.has(getRaw(object(value)))) {
              for (const [name, msg] of Object.entries(object(object(value).messages))) {
                if (tagged(msg)) {
                  message(`${channelName}: ${name}`, msg, 2)
                  matched = true
                }
              }
            }
          }
          if (!matched) {
            throw new Error(`Unknown tag: ${selection.name}`)
          }
        } else if (selection.kind === 'channel') {
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
      finish()
      // Explicit anchors keep navigation independent of a Markdown viewer's slug rules.
      const anchors = createDocumentAnchors()
      const contents = []
      for (const block of [...blocks]) {
        if (block.type !== 'heading' || block.depth < 2 || block.depth > 3) {
          continue
        }
        const label = block.children.map((child) => ('value' in child ? child.value : '')).join('')
        const index = blocks.indexOf(block)
        const previous = blocks[index - 1]
        const existing = previous?.type === 'html' ? /<a id="([^"]+)"/.exec(previous.value)?.[1] : undefined
        const id = existing ?? anchors.get('section', String(index), label)
        if (!existing) {
          blocks.splice(index, 0, anchor(id))
        }
        contents.push(item(paragraph(link(`#${id}`, label))))
      }
      if (contents.length && selection !== 'introduction') {
        const index = blocks.findIndex((block) => block.type === 'heading' && block.depth === 1)
        blocks.splice(index + 1, 0, heading(2, text('Contents')), list(contents))
      }
      await expandDescriptions(blocks, descriptions())
      return serializer.stringify({ type: 'root', children: blocks } satisfies Root)
    },
  }
}
