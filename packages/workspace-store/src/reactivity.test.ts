import { describe, expect, it, vi } from 'vitest'
import { computed, effect, nextTick } from 'vue'

import { type WorkspaceDocumentInput, createWorkspaceStore } from '@/client'
import { getDocumentRevision } from '@/helpers/document-revision'
import { getResolvedRef } from '@/helpers/get-resolved-ref'
import { getResolvedRefDeep } from '@/helpers/get-resolved-ref-deep'
import type { WorkspaceStateChangeEvent } from '@/workspace-plugin'

/**
 * Reads through the store pass a stack of proxies — Vue's `reactive` over the detect-changes proxy over
 * the overrides proxy over the magic proxy — and the helpers below were made cheaper by skipping work in
 * the inner layers. What the existing tests prove is that a second call returns the edited value; these
 * prove the stronger property the API client actually needs, that a Vue effect re-runs at all.
 *
 * Every mutation here is made in place through the store's document, which is how the client edits.
 */

const addDocument = async (document: Record<string, unknown>, plugins?: Parameters<typeof createWorkspaceStore>[0]) => {
  const store = createWorkspaceStore(plugins)
  await store.addDocument({ name: 'default', document } as WorkspaceDocumentInput)

  return { store, document: store.workspace.documents['default']! }
}

/** A schema whose properties the tests add to, remove from, and edit in place. */
const userDocument = () => ({
  openapi: '3.1.0',
  info: { title: 'My API', version: '1.0.0' },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', title: 'before' },
        },
      },
    },
  },
})

const getSchemas = (document: Record<string, any>): Record<string, any> => document.components.schemas

describe('getResolvedRefDeep through the store', () => {
  it('re-evaluates a computed when a nested property is edited in place', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    let runs = 0
    const resolved = computed(() => {
      runs++
      return getResolvedRefDeep(schemas['User']) as Record<string, any>
    })

    expect(resolved.value.properties.id.title).toBe('before')
    expect(runs).toBe(1)

    schemas['User'].properties.id.title = 'after'

    expect(resolved.value.properties.id.title).toBe('after')
    expect(runs).toBe(2)
  })

  it('re-evaluates a computed when a property is added', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    const resolved = computed(() => getResolvedRefDeep(schemas['User']) as Record<string, any>)

    expect(Object.keys(resolved.value.properties)).toEqual(['id'])

    // The walk reads `Object.keys`, so an added key has to trigger through the iterate dependency.
    schemas['User'].properties.email = { type: 'string' }

    expect(Object.keys(resolved.value.properties)).toEqual(['id', 'email'])
  })

  it('re-evaluates a computed when a property is deleted', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    const resolved = computed(() => getResolvedRefDeep(schemas['User']) as Record<string, any>)

    expect(Object.keys(resolved.value.properties)).toEqual(['id'])

    delete schemas['User'].properties.id

    expect(Object.keys(resolved.value.properties)).toEqual([])
  })

  it('re-evaluates a computed when an array element is edited in place', async () => {
    const { document } = await addDocument({
      openapi: '3.1.0',
      info: { title: 'My API', version: '1.0.0' },
      components: { schemas: { User: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } } } },
    })
    const schemas = getSchemas(document)

    const resolved = computed(() => getResolvedRefDeep(schemas['User']) as Record<string, any>)

    expect(resolved.value.required).toEqual(['id'])

    schemas['User'].required.push('email')

    expect(resolved.value.required).toEqual(['id', 'email'])
  })

  it('re-runs an effect when a nested property is edited in place', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    const seen: unknown[] = []
    effect(() => {
      seen.push((getResolvedRefDeep(schemas['User']) as Record<string, any>).properties.id.title)
    })

    expect(seen).toEqual(['before'])

    schemas['User'].properties.id.title = 'after'
    await nextTick()

    expect(seen).toEqual(['before', 'after'])
  })
})

describe('getResolvedRef through a pass-through stub', () => {
  /** What `resolve()` leaves behind: the component is a `$global` stub and the content sits under `x-ext`. */
  const stubDocument = (target: Record<string, unknown>) => ({
    openapi: '3.1.0',
    info: { title: 'My API', version: '1.0.0' },
    'x-ext': { abc: target },
    components: {
      schemas: {
        User: { $ref: '#/x-ext/abc', $global: true },
        Wrapper: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
      },
    },
  })

  it('re-evaluates a computed when the target of the chain is edited', async () => {
    const { document } = await addDocument(stubDocument({ type: 'object', title: 'before' }))
    const schemas = getSchemas(document)
    const property = schemas['Wrapper'].properties.user

    let runs = 0
    const resolvedTitle = computed(() => {
      runs++
      return (getResolvedRef(property) as Record<string, any> | undefined)?.title
    })

    expect(resolvedTitle.value).toBe('before')
    expect(runs).toBe(1)

    // Edit the node the chain ends at, two hops from the property.
    ;(document as Record<string, any>)['x-ext'].abc.title = 'after'

    expect(resolvedTitle.value).toBe('after')
    expect(runs).toBe(2)
  })

  it('does not see a reference target that is replaced wholesale', async () => {
    // A limitation of the magic proxy, not of the resolution above it: it memoizes `$ref-value` per
    // `$ref` string in a plain Map, so the first node a pointer resolved to is the one every later read
    // gets, and no Vue dependency is registered on the property that holds it. Editing that node in
    // place is seen (the test above); swapping the node out is not. This reproduces on a single-hop
    // reference too, so it is what the store has always done — a target arriving late has to reach
    // consumers by replacing the document, which is what `addDocument` does.
    const { document } = await addDocument({
      openapi: '3.1.0',
      info: { title: 'My API', version: '1.0.0' },
      components: {
        schemas: {
          User: { type: 'object', title: 'original' },
          Wrapper: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
        },
      },
    })
    const schemas = getSchemas(document)
    const resolvedTitle = computed(() => (getResolvedRef(schemas['Wrapper'].properties.user) as any)?.title)

    expect(resolvedTitle.value).toBe('original')

    schemas['User'] = { type: 'object', title: 'replaced' }

    expect(resolvedTitle.value).toBe('original')
  })
})

describe('the detect-changes proxy under reactive', () => {
  it('returns the identical reactive proxy for the same nested node', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    expect(schemas['User'].properties).toBe(schemas['User'].properties)
    expect(getSchemas(document)['User']).toBe(schemas['User'])
  })

  it('re-runs an effect that read a nested value when it is set through the store', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    const seen: unknown[] = []
    effect(() => {
      seen.push(schemas['User'].properties.id.title)
    })

    expect(seen).toEqual(['before'])

    schemas['User'].properties.id.title = 'after'
    await nextTick()

    expect(seen).toEqual(['before', 'after'])
  })

  it('reports the full path of the write to the change hook', async () => {
    const onWorkspaceStateChanges = vi.fn()
    const { document } = await addDocument(userDocument(), {
      plugins: [{ name: 'spy', hooks: { onWorkspaceStateChanges } }],
    } as never)
    const schemas = getSchemas(document)

    onWorkspaceStateChanges.mockClear()
    schemas['User'].properties.id.title = 'after'

    // `documents` and the document name are sliced off before the event is fired.
    const paths = onWorkspaceStateChanges.mock.calls.map((call) => {
      const event = call[0] as WorkspaceStateChangeEvent
      return event.type === 'documents' ? event.path : undefined
    })
    expect(paths).toContainEqual(['components', 'schemas', 'User', 'properties', 'id', 'title'])
  })

  it('reports the path of a deletion to the change hook', async () => {
    const onWorkspaceStateChanges = vi.fn()
    const { document } = await addDocument(userDocument(), {
      plugins: [{ name: 'spy', hooks: { onWorkspaceStateChanges } }],
    } as never)
    const schemas = getSchemas(document)

    onWorkspaceStateChanges.mockClear()
    delete schemas['User'].properties.id

    const paths = onWorkspaceStateChanges.mock.calls.map((call) => {
      const event = call[0] as WorkspaceStateChangeEvent
      return event.type === 'documents' ? event.path : undefined
    })
    expect(paths).toContainEqual(['components', 'schemas', 'User', 'properties', 'id'])
  })
})

describe('getDocumentRevision is not reactive', () => {
  it('moves on a write but does not re-run a computed that only reads it', async () => {
    const { document } = await addDocument(userDocument())
    const schemas = getSchemas(document)

    let runs = 0
    const revision = computed(() => {
      runs++
      return getDocumentRevision(document)
    })

    const before = revision.value
    expect(runs).toBe(1)

    schemas['User'].properties.id.title = 'after'
    await nextTick()

    // The number has moved...
    expect(getDocumentRevision(document)).toBeGreaterThan(before)
    // ...but nothing tracked it, so the computed is still holding the old one.
    expect(revision.value).toBe(before)
    expect(runs).toBe(1)
  })
})
