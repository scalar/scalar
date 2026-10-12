import { getRaw } from '@scalar/json-magic/magic-proxy'
import { resolveTraits } from '@scalar/workspace-store/helpers/resolve-traits'

import { sharedDocument } from '../benchmarks/fixtures'
import { object, own, string } from '../src/document'
import events from '../src/fixtures/events.json'
import { loadDocument } from '../src/load-document'
import { createRenderer } from '../src/render-document'
import { renderPreview } from './preview'
import type { ExportResult, Manifest, Page } from './types'

/** Use map keys, never display titles, to populate page selectors. */
const getManifest = (document: Record<string, unknown>): Manifest => {
  const pages: Page[] = [{ label: 'Introduction', options: { introduction: true } }]
  const tags = new Set<string>()
  const collectTags = (input: unknown): void => {
    const value = object(input)
    const merged = resolveTraits(value, Array.isArray(value.traits) ? value.traits.map(object) : [])
    if (Array.isArray(merged.tags)) {
      for (const tag of merged.tags) {
        const name = string(object(tag).name)
        if (name) {
          tags.add(name)
        }
      }
    }
  }
  collectTags(document.info)
  for (const [name, value] of Object.entries(object(document.channels))) {
    pages.push({ label: `Channel: ${name}`, options: { channel: name } })
    collectTags(value)
    for (const [message, msg] of Object.entries(object(object(value).messages))) {
      const escape = (value: string): string => value.replaceAll('~', '~0').replaceAll('/', '~1')
      pages.push({
        label: `Message: ${name} / ${message}`,
        options: { message: { pointer: `#/channels/${escape(name)}/messages/${escape(message)}` } },
      })
      collectTags(msg)
    }
  }
  for (const [name, value] of Object.entries(object(document.operations))) {
    pages.push({ label: `Operation: ${name}`, options: { operation: name } })
    collectTags(value)
  }
  for (const [name, value] of Object.entries(object(own(document.components, 'messages')))) {
    pages.push({ label: `Message: ${name}`, options: { message: name } })
    collectTags(value)
  }
  for (const name of Object.keys(object(own(document.components, 'schemas')))) {
    pages.push({ label: `Model: ${name}`, options: { model: name } })
  }
  for (const tag of tags) {
    pages.push({ label: `Tag: ${tag}`, options: { tag } })
  }
  return {
    title: string(object(document.info).title) ?? 'AsyncAPI',
    pages,
    operations: Object.keys(object(document.operations)).length,
    models: Object.keys(object(own(document.components, 'schemas'))).length,
  }
}

/** Cache prepared fixtures so page timings measure rendering rather than loading. */
export const createExportService = (): ((
  pathname: string,
  search: string,
) => Promise<Manifest | ExportResult | string>) => {
  const cache = new Map<string, Promise<{ manifest: Manifest; render: ReturnType<typeof createRenderer> }>>()
  return async (pathname, search) => {
    const query = new URLSearchParams(search)
    const id = query.get('document') ?? 'events'
    if (!['events', 'shared'].includes(id)) {
      throw new Error('Unknown example document')
    }
    if (!cache.has(id)) {
      cache.set(
        id,
        loadDocument(id === 'events' ? getRaw(events) : sharedDocument()).then((document) => ({
          manifest: getManifest(document),
          render: createRenderer(document),
        })),
      )
    }
    const { manifest, render } = await cache.get(id)!
    if (pathname === '/__markdown/document') {
      return manifest
    }
    const index = query.get('page')
    const page = index === null ? undefined : manifest.pages[Number(index)]
    if (index !== null && (!/^\d+$/.test(index) || !page)) {
      throw new Error('Unknown page selection')
    }
    const options = {
      ...page?.options,
      ...(query.get('linked') === 'true'
        ? {
            schemaReferences: {
              mode: 'linked' as const,
              resolveUrl: ({ name }: { name: string }): string =>
                `/?document=${encodeURIComponent(id)}&model=${encodeURIComponent(name)}&linked=true`,
            },
          }
        : {}),
    }
    const start = performance.now()
    const markdown = await render.render(options)
    const milliseconds = performance.now() - start
    return pathname === '/llms.txt'
      ? markdown
      : { markdown, html: renderPreview(markdown), milliseconds, bytes: Buffer.byteLength(markdown) }
  }
}
