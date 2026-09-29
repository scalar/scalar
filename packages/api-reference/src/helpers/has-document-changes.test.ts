import diff from 'microdiff'
import { describe, expect, it } from 'vitest'
import { computed, nextTick, reactive, watch } from 'vue'

import { hasDocumentChanges } from './has-document-changes'
import { normalizeConfigurations } from './normalize-configurations'

describe('has-document-changes', () => {
  const document = {
    openapi: '3.1.0',
    info: { title: 'Example', version: '1.0' },
    paths: { '/hello': { get: { summary: 'Hello', responses: { '200': { description: 'OK' } } } } },
    components: { schemas: { Greeting: { type: 'string' } } },
  }

  it('ignores unchanged documents and new objects with identical content', () => {
    expect(hasDocumentChanges(document, document)).toBe(false)
    expect(hasDocumentChanges(structuredClone(document), document)).toBe(false)
  })

  it('detects a title change with shared paths and components', () => {
    expect(hasDocumentChanges({ ...document, info: { ...document.info, title: 'Updated' } }, document)).toBe(true)
  })

  it('detects nested operation and schema changes', () => {
    const operationEdit = structuredClone(document)
    operationEdit.paths['/hello'].get.summary = 'Updated operation'
    const schemaEdit = structuredClone(document)
    schemaEdit.components.schemas.Greeting.type = 'number'

    expect(hasDocumentChanges(operationEdit, document)).toBe(true)
    expect(hasDocumentChanges(schemaEdit, document)).toBe(true)
  })

  it.each([
    [{ added: undefined }, {}],
    [{}, { removed: undefined }],
    [{ value: null }, { value: {} }],
    [{ value: [1, 2] }, { value: [2, 1] }],
    [{ value: [1] }, { value: [1, 2] }],
    [{ value: Number.NaN }, { value: Number.NaN }],
    [{ value: -0 }, { value: 0 }],
    [{ value: new Date('2026-01-01') }, { value: new Date('2026-01-01') }],
    [{ value: new Date('2026-01-01') }, { value: new Date('2026-01-02') }],
    [{ value: /hello/i }, { value: /hello/g }],
  ])('preserves deep comparison semantics for %j and %j', (updated, previous) => {
    expect(hasDocumentChanges(updated, previous)).toBe(diff(updated, previous).length > 0)
  })

  it('preserves comparison of cyclic and shared values', () => {
    const previous: Record<string, unknown> = { ...document }
    previous.cycle = previous
    const updated = structuredClone(previous)
    expect(hasDocumentChanges(updated, previous)).toBe(diff(updated, previous).length > 0)
    updated.info = { title: 'Changed', version: '1.0' }
    expect(hasDocumentChanges(updated, previous)).toBe(true)
    expect(hasDocumentChanges({ left: document, right: document }, { left: document, right: document })).toBe(false)
  })

  it('keeps deep reactive change detection equivalent across configuration updates', async () => {
    const configuration = reactive({ content: structuredClone(document), slug: 'example', hideModels: false })
    const configurations = computed(() => Object.values(normalizeConfigurations(configuration)))
    const changes: { content: boolean; original: boolean; slug: string }[] = []
    const stop = watch(
      configurations,
      (updated, previous) => {
        const source = updated[0]!.source.content ?? {}
        const oldSource = previous[0]!.source.content ?? {}
        changes.push({
          content: hasDocumentChanges(source, oldSource),
          original: diff(source, oldSource).length > 0,
          slug: updated[0]!.slug,
        })
      },
      { deep: true },
    )

    // Normalization currently shares nested objects, so neither comparator can reconstruct
    // the previous value after an in-place nested edit. Keep that limitation visible.
    configuration.content.info.title = 'In-place edit'
    await nextTick()
    configuration.content = { ...configuration.content, info: { title: 'Replacement', version: '1.0' } }
    await nextTick()
    configuration.content = structuredClone(document)
    await nextTick()
    configuration.hideModels = true
    await nextTick()
    configuration.content.openapi = '3.1.1'
    await nextTick()
    configuration.slug = 'renamed'
    await nextTick()
    stop()

    expect(changes).toStrictEqual([
      { content: false, original: false, slug: 'example' },
      { content: true, original: true, slug: 'example' },
      { content: true, original: true, slug: 'example' },
      { content: false, original: false, slug: 'example' },
      { content: true, original: true, slug: 'example' },
      { content: false, original: false, slug: 'renamed' },
    ])
  })
})
