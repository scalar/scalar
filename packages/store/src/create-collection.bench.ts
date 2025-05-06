import { createWorkspaceStore } from '@scalar/api-client/store'
import { dereference, upgrade } from '@scalar/openapi-parser'
import { waitFor } from '@test/utils/waitFor'
import { bench, describe, expect } from 'vitest'
import { createCollection } from './create-collection'
import { createCollection as createCollectionOld } from './slow/create-collection'

describe('create-collection', () => {
  describe('old vs. new', () => {
    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        version: '2.0.0',
      },
      paths: {
        '/foobar': {
          $ref: '#/components/pathItems/Foobar',
        },
      },
      components: {
        pathItems: {
          Foobar: {
            post: {
              summary: 'Foobar',
            },
          },
        },
      },
    }

    // how we used to create the store (the hard work is done right-away)
    bench('old store', async () => {
      const workspaceStore = createWorkspaceStore({
        useLocalStorage: false,
      })
      workspaceStore.workspaceMutators.add('default')
      workspaceStore.importSpecFile(EXAMPLE_DOCUMENT, 'default')

      await waitFor(() => {
        return Object.values(workspaceStore.requests)[1]?.summary === 'Foobar'
      })

      expect(Object.values(workspaceStore.requests)[1]?.summary ?? '').toBe('Foobar')
    })

    // how we create the store now (the hard work is done on-demand)
    bench('new store', async () => {
      const store = createCollection(EXAMPLE_DOCUMENT)

      // @ts-expect-error TODO: fix this
      expect(store.document?.paths?.['/foobar'].post.summary).toBe('Foobar')
    })
  })

  describe('cache', () => {
    // Create a document with many repeated $refs to the same object
    const NUM_PATHS = 100

    const EXAMPLE_DOCUMENT = {
      openapi: '3.1.1',
      info: {
        title: 'Hello World',
        version: '2.0.0',
      },
      paths: Object.fromEntries(
        Array.from({ length: NUM_PATHS }, (_, i) => [`/foo${i}`, { $ref: '#/components/pathItems/Foobar' }]),
      ),
      components: {
        pathItems: {
          Foobar: {
            get: {
              summary: 'Shared Foobar',
            },
          },
        },
      },
    }

    const TRIES = 100

    bench('with cache', async () => {
      const store = createCollection(EXAMPLE_DOCUMENT, { cache: true })

      for (let i = 0; i < TRIES; i++) {
        for (let j = 0; j < NUM_PATHS; j++) {
          // @ts-expect-error TODO: fix this
          expect(store.document?.paths?.[`/foo${j}`].get.summary).toBe('Shared Foobar')
        }
      }
    })

    bench('without cache', async () => {
      const store = createCollection(EXAMPLE_DOCUMENT, { cache: false })

      for (let i = 0; i < TRIES; i++) {
        for (let j = 0; j < NUM_PATHS; j++) {
          // @ts-expect-error TODO: fix this
          expect(store.document?.paths?.[`/foo${j}`].get.summary).toBe('Shared Foobar')
        }
      }
    })
  })

  describe('compare dereference vs createWorkspace', async () => {
    // Fetch the Stripe OpenAPI document once for all benchmarks
    const EXAMPLE_DOCUMENT = await fetch(
      'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
    ).then((r) => r.json())

    bench('full dereference (upgrading, but no Zod)', async () => {
      const { specification: upgraded } = upgrade(EXAMPLE_DOCUMENT)
      const { schema } = await dereference(upgraded)

      await waitFor(() => {
        return !!schema?.components?.schemas?.account?.properties?.capabilities
      })

      expect(schema?.components?.schemas?.account?.properties?.capabilities).toBeDefined()
      expect(schema?.components?.schemas?.account?.properties?.capabilities.$ref).toBeUndefined()
    })

    bench('new createCollection', async () => {
      const workspace = createCollection(EXAMPLE_DOCUMENT)

      await waitFor(() => {
        return !!workspace.document?.components?.schemas?.account?.properties?.capabilities
      })

      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities).toBeDefined()
      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities.$ref).toBeUndefined()
    })
  })

  describe.only('optimize createCollection', async () => {
    // Fetch the Stripe OpenAPI document once for all benchmarks
    const EXAMPLE_DOCUMENT = await fetch(
      'https://raw.githubusercontent.com/stripe/openapi/refs/heads/master/openapi/spec3.json',
    ).then((r) => r.json())

    bench('new', async () => {
      const workspace = createCollection(EXAMPLE_DOCUMENT)

      await waitFor(() => {
        return !!workspace.document?.components?.schemas?.account?.properties?.capabilities
      })

      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities).toBeDefined()
      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities.$ref).toBeUndefined()
    })

    bench('old', async () => {
      const workspace = createCollectionOld(EXAMPLE_DOCUMENT)

      await waitFor(() => {
        return !!workspace.document?.components?.schemas?.account?.properties?.capabilities
      })

      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities).toBeDefined()
      expect(workspace.document?.components?.schemas?.account?.properties?.capabilities.$ref).toBeUndefined()
    })
  })
})
