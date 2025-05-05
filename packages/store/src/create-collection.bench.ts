import { dereference } from '@scalar/openapi-parser'
import { bench, describe, expect } from 'vitest'
import { createCollection } from './create-collection.ts'

import { createWorkspaceStore } from '@scalar/api-client/store'
import { waitFor } from '@test/utils/waitFor.ts'

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

    // plain dereference (not even passing Zod)
    bench.skip('dereference', async () => {
      const { schema } = await dereference(EXAMPLE_DOCUMENT)

      expect(schema?.paths?.['/foobar']?.post?.summary).toBe('Foobar')
    })

    // how we used to create the store (the hard work is done right-away)
    bench('old store', async () => {
      const workspaceStore = createWorkspaceStore({
        useLocalStorage: false,
      })
      workspaceStore.workspaceMutators.add('default')
      workspaceStore.importSpecFile(EXAMPLE_DOCUMENT, 'default')

      await waitFor(() => {
        // @ts-expect-error
        return Object.values(workspaceStore.requests)[1]?.summary === 'Foobar'
      })

      // @ts-expect-error whatever
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
})
