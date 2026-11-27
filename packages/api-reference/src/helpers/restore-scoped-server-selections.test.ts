import type { OpenApiDocument, PathItemObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { restoreScopedServerSelections } from './restore-scoped-server-selections'

describe('restore-scoped-server-selections', () => {
  it.each(['constructor', 'toString'])('does not restore a selection from an inherited webhook named %s', (name) => {
    const info = { title: 'Webhooks', version: '1' }
    const webhook: PathItemObject = { servers: [{ url: '/one' }, { url: '/two' }], post: { responses: {} } }
    const previous: OpenApiDocument = {
      openapi: '3.1.0',
      info,
      'x-scalar-original-document-hash': '',
      webhooks: Object.create({ [name]: { ...webhook, 'x-scalar-selected-server': '/two' } }),
    }
    const current: OpenApiDocument = { ...previous, webhooks: { [name]: webhook } }

    restoreScopedServerSelections(previous, current)

    expect(webhook['x-scalar-selected-server']).toBeUndefined()
  })
})
