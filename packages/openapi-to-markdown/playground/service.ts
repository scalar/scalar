import { readFile } from 'node:fs/promises'

import { forEachPathItemOperation } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { loadDocument } from '../src/load-document'
import { createDocumentRenderer } from '../src/render-document'
import { formatOperationMethod } from '../src/render-operation'
import { selectDocument } from '../src/select-document'
import { documents } from './documents'
import { renderPreview } from './preview'
import type { ExportResult, Manifest, Page } from './types'

/** Collect selectable pages without relying on potentially duplicated operation IDs. */
export const getManifest = (document: OpenApiDocument): Manifest => {
  const pages: Page[] = [{ label: 'Introduction', options: { introduction: true } }]
  let operations = 0
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    forEachPathItemOperation(item, (method) => {
      operations++
      pages.push({ label: `${formatOperationMethod(method)} ${path}`, options: { operation: { path, method } } })
    })
  }
  for (const [name, item] of Object.entries(document.webhooks ?? {})) {
    forEachPathItemOperation(item, (method) =>
      pages.push({
        label: `Webhook: ${formatOperationMethod(method)} ${name}`,
        options: { webhook: { name, method } },
      }),
    )
  }
  for (const name of Object.keys(document.components?.schemas ?? {})) {
    pages.push({ label: `Model: ${name}`, options: { model: name } })
  }
  for (const name of new Set([
    ...(document.tags?.map((tag) => tag.name) ?? []),
    ...Object.values(document.paths ?? {}).flatMap((item) => {
      const tags: string[] = []
      forEachPathItemOperation(item, (_, operation) => tags.push(...(operation.tags ?? [])))
      return tags
    }),
  ])) {
    pages.push({ label: `Tag: ${name}`, options: { tag: name } })
  }
  return {
    title: document.info.title,
    pages,
    operations,
    models: Object.keys(document.components?.schemas ?? {}).length,
  }
}

/** Keep one resolved document in memory; switching examples releases the previous renderer. */
export const createExportService = (): ((
  pathname: string,
  search: string,
) => Promise<Manifest | ExportResult | string>) => {
  let current:
    | {
        id: string
        value: Promise<{
          document: OpenApiDocument
          manifest: Manifest
          render: ReturnType<typeof createDocumentRenderer>
        }>
      }
    | undefined
  const load = (id: string): NonNullable<typeof current>['value'] => {
    const example = documents.find((entry) => entry.id === id)
    if (!example) {
      throw new Error('Unknown example document')
    }
    if (current?.id === id) {
      return current.value
    }
    const value = (async () => {
      const input =
        id === 'galaxy'
          ? await readFile(new URL(import.meta.resolve('@scalar/galaxy/latest.yaml')), 'utf8')
          : await fetch(example.source, { signal: AbortSignal.timeout(120_000) }).then((response) => {
              if (!response.ok) {
                throw new Error(`Could not load ${example.name}: HTTP ${response.status}`)
              }
              return response.text()
            })
      const document = await loadDocument(input)
      return { document, manifest: getManifest(document), render: createDocumentRenderer() }
    })()
    current = { id, value }
    void value.catch(() => {
      if (current?.value === value) {
        current = undefined
      }
    })
    return value
  }
  return async (pathname, search) => {
    const url = new URL(`${pathname}?${search}`, 'http://localhost')
    const id = url.searchParams.get('document') ?? 'galaxy'
    const { document, manifest, render } = await load(id)
    if (pathname === '/__markdown/document') {
      return manifest
    }
    const index = url.searchParams.get('page')
    const page = index === null ? undefined : manifest.pages[Number(index)]
    if (index !== null && (!/^\d+$/.test(index) || !page)) {
      throw new Error('Unknown page selection')
    }
    const options = {
      ...page?.options,
      ...(url.searchParams.get('linked') === 'true'
        ? {
            schemaReferences: {
              mode: 'linked' as const,
              resolveUrl: ({ name }: { name: string }): string | undefined =>
                document.components?.schemas?.[name] !== undefined
                  ? `/?document=${encodeURIComponent(id)}&model=${encodeURIComponent(name)}&linked=true`
                  : undefined,
            },
          }
        : {}),
    }
    const start = performance.now()
    const markdown = await render(selectDocument(document, options), options)
    const milliseconds = performance.now() - start
    console.info(`${id}: exported ${Buffer.byteLength(markdown)} bytes in ${Math.round(milliseconds)} ms`)
    if (pathname === '/llms.txt') {
      return markdown
    }
    const html = renderPreview(markdown)
    console.info(`${id}: preview ready`)
    return { markdown, html, milliseconds, bytes: Buffer.byteLength(markdown) }
  }
}
