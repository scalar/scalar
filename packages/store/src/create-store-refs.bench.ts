import { dereference } from '@scalar/openapi-parser'
import { bench, describe, expect } from 'vitest'
import { createStore } from './create-store-refs.ts'

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

describe('create-store-refs', () => {
  bench('dereference', async () => {
    const { schema } = await dereference(EXAMPLE_DOCUMENT)

    expect(schema?.paths?.['/foobar']?.post?.summary).toBe('Foobar')
  })

  bench('old store', async () => {
    const workspaceStore = createWorkspaceStore({
      useLocalStorage: false,
    })

    workspaceStore.workspaceMutators.add('default')

    workspaceStore.importSpecFile(EXAMPLE_DOCUMENT, 'default')

    await new Promise((resolve) => {
      const checkRequests = () => {
        const request = Object.values(workspaceStore.requests)[1]
        // @ts-expect-error
        if (request?.summary === 'Foobar') {
          resolve(undefined)
        } else {
          setTimeout(checkRequests, 1)
        }
      }
      checkRequests()
    })

    expect(Object.values(workspaceStore.requests)[1]?.summary ?? '').toBe('Foobar')
  })

  bench('new store', async () => {
    const store = createStore(EXAMPLE_DOCUMENT)

    expect(store.document.paths?.['/foobar'].post.summary).toBe('Foobar')
  })
})
