import { dereference } from '@scalar/openapi-parser'
import { bench, describe, expect } from 'vitest'
import { createCollection } from './create-collection.ts'

import { createWorkspaceStore } from '@scalar/api-client/store'

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

describe('create-collection', () => {
  bench.skip('dereference', async () => {
    const { schema } = await dereference(EXAMPLE_DOCUMENT)

    expect(schema?.paths?.['/foobar']?.post?.summary).toBe('Foobar')
  })

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

  bench('new store', async () => {
    const store = createCollection(EXAMPLE_DOCUMENT)

    // @ts-expect-error TODO: fix this
    expect(store.document?.paths?.['/foobar'].post.summary).toBe('Foobar')
  })
})

/**
 * Asynchronously waits for a condition to become true, or throws after maxTries.
 * Waits for a short delay between tries.
 *
 * @param condition - Function that returns true when the wait should stop
 * @param maxTries - Maximum number of iterations to try (default: 100_000)
 * @param delayMs - Delay in milliseconds between tries (default: 1)
 */
async function waitFor(condition: () => boolean, maxTries = 100_000, delayMs = 1): Promise<void> {
  let tries = 0
  while (!condition() && tries < maxTries) {
    tries++
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }
  if (tries === maxTries) {
    throw new Error('waitFor: Condition not met in time')
  }
}
