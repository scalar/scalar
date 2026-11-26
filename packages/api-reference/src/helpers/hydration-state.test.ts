import { createWorkspaceStore } from '@scalar/workspace-store/client'
import { describe, expect, it } from 'vitest'

import { parseHydrationState, serializeHydrationState } from './hydration-state'
import { safeDeepClone } from './safe-deep-clone'

const createState = async (title = 'Hydration API'): Promise<ReturnType<typeof parseHydrationState>> => {
  const store = createWorkspaceStore()
  await store.addDocument({
    name: 'api',
    document: { openapi: '3.1.0', info: { title, version: '1.0.0' }, paths: {} },
  })
  const reference = store.exportWorkspace()
  const client = {
    ...safeDeepClone(reference),
    originalDocuments: {},
    intermediateDocuments: {},
    overrides: {},
    meta: { 'x-scalar-active-document': 'api' },
  }
  client.documents.api = {
    ...client.documents.api!,
    'x-scalar-selected-server': 'https://api.example.com',
  }
  return { slug: 'api', reference, client }
}

describe('hydration-state', () => {
  it('round-trips the preloaded workspaces and client-specific fields', async () => {
    const state = await createState()
    const serialized = serializeHydrationState(state)

    expect(parseHydrationState(serialized)).toStrictEqual(JSON.parse(JSON.stringify(state)))
    const payload = JSON.parse(serialized)
    expect(payload.client.documents).toStrictEqual({ api: { 'x-scalar-selected-server': 'https://api.example.com' } })
    expect(Object.keys(payload.reference).sort()).toStrictEqual(['documents', 'meta', 'originalDocuments', 'overrides'])
    expect(Object.keys(payload.client).sort()).toStrictEqual(['documents', 'meta'])
  })

  it('excludes auth and history from both stores', async () => {
    const state = await createState()
    for (const workspace of [state.reference, state.client]) {
      workspace.auth = {
        api: { secrets: { apiKey: { type: 'apiKey', 'x-scalar-secret-token': 'private-token' } }, selected: {} },
      }
      workspace.history = { api: { '/private-history': { get: [] } } }
    }
    const serialized = serializeHydrationState(state)
    expect(serialized).not.toContain('private-token')
    expect(serialized).not.toContain('/private-history')
    const restored = parseHydrationState(serialized)
    for (const workspace of [restored.reference, restored.client]) {
      expect(workspace.auth).toStrictEqual({})
      expect(workspace.history).toStrictEqual({})
    }
  })

  it('escapes inline HTML without changing document content', async () => {
    const state = await createState('</script><script>alert(1)</script>&')
    const serialized = serializeHydrationState(state)
    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('&')
    expect(parseHydrationState(serialized)).toStrictEqual(JSON.parse(JSON.stringify(state)))
  })

  it('isolates client edits and intermediate snapshots from the reference and original', async () => {
    const state = await createState()
    const restored = parseHydrationState(serializeHydrationState(state))
    const referenceBeforeEdits = safeDeepClone(restored.reference)
    restored.client.documents.api!.info.title = 'Edited client'
    Object.assign(restored.reference.intermediateDocuments.api!, { info: { title: 'Edited intermediate' } })

    expect(restored.reference.documents).toStrictEqual(referenceBeforeEdits.documents)
    expect(restored.reference.originalDocuments).toStrictEqual(referenceBeforeEdits.originalDocuments)
  })

  it('rejects malformed JSON so the component can use its normal loading path', () => {
    expect(() => parseHydrationState('{invalid')).toThrow(SyntaxError)
  })
})
