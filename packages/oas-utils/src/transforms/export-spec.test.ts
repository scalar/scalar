import type { Request, RequestExample, SecurityScheme, Tag } from '@/entities/spec'
import { exportSpecFromWorkspace, importSpecToWorkspace } from '@/transforms'
import { describe, expect, it } from 'vitest'

/** Convert an array of objects into a map of objects by UID */
function arrayToUidMap<T extends { uid: string }>(array: T[]) {
  return array.reduce<Record<string, T>>((map, item) => {
    map[item.uid] = item
    return map
  }, {})
}

const testSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Swagger Petstore - OpenAPI 3.1',
    version: '1.0.0',
  },
  paths: {
    '/pet': {
      put: {
        tags: ['pet'],
        summary: 'Update an existing pet',
        description: 'Update an existing pet by Id',
        operationId: 'updatePet',
        parameters: [
          {
            in: 'query',
            name: 'id',
            schema: {
              type: 'string',
            },
          },
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['cat', 'dog', 'frog', 'bat'],
            },
          },
        ],
      },
      delete: {
        tags: ['pet'],
        summary: 'Delete an existing pet',
        description: 'Delete an existing pet by Id',
        operationId: 'deletePet',
        parameters: [
          {
            in: 'query',
            name: 'id',
            schema: {
              type: 'string',
            },
          },
        ],
      },
    },
  },
}

const galaxy = await fetch('https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json').then((r) => r.json())

describe('Converts a collection into a spec', () => {
  it('Handles basic spec', async () => {
    const workspace = await importSpecToWorkspace(testSpec)
    if (workspace.error) throw Error('Bad workspace')

    const exported = exportSpecFromWorkspace({
      requests: arrayToUidMap<Request>(workspace.requests),
      collection: workspace.collection,
      requestExamples: arrayToUidMap<RequestExample>(workspace.examples),
      securitySchemes: arrayToUidMap<SecurityScheme>(workspace.securitySchemes),
      tags: arrayToUidMap<Tag>(workspace.tags),
    })

    expect(exported.paths).toHaveProperty('/pet')
    expect(exported.paths['/pet']).toHaveProperty('put')
    expect(exported.paths['/pet']).toHaveProperty('delete')
  })
})

describe('Workspace output matches input when round-tripped', async () => {
  const baseWorkspace = await importSpecToWorkspace(galaxy)
  if (baseWorkspace.error) throw Error('Bad workspace')

  // TODO:
  // Modify workspace to test export functionality

  const exported = exportSpecFromWorkspace({
    requests: arrayToUidMap<Request>(baseWorkspace.requests),
    collection: baseWorkspace.collection,
    requestExamples: arrayToUidMap<RequestExample>(baseWorkspace.examples),
    securitySchemes: arrayToUidMap<SecurityScheme>(baseWorkspace.securitySchemes),
    tags: arrayToUidMap<Tag>(baseWorkspace.tags),
  })

  const nextWorkspace = await importSpecToWorkspace(exported)
  if (nextWorkspace.error) throw Error('Bad round-tripped workspace')

  const baseRequests = arrayToUidMap<Request>(baseWorkspace.requests)

  const baseExamples = arrayToUidMap<RequestExample>(baseWorkspace.examples)
  const nextExamples = arrayToUidMap<RequestExample>(nextWorkspace.examples)

  const baseSecuritySchemes = arrayToUidMap<SecurityScheme>(baseWorkspace.securitySchemes)
  const nextSecuritySchemes = arrayToUidMap<SecurityScheme>(nextWorkspace.securitySchemes)

  function getMatchingRequest(uid: string) {
    if (nextWorkspace.error) throw Error('Bad round-tripped workspace')

    const base = baseRequests[uid]
    const next = nextWorkspace.requests.find((r) => r.path === base.path && r.method === base.method)

    if (!next) throw Error('Request not found')
    return { base, next }
  }

  it('Collections have the same number of requests', () => {
    expect(baseWorkspace.collection.requests.length).toEqual(nextWorkspace.collection.requests.length)
  })

  it('Requests have the same examples', async () => {
    baseWorkspace.collection.requests.forEach((uid) => {
      const { base, next } = getMatchingRequest(uid)

      expect(base.examples.length).toEqual(next.examples.length)
    })

    // expect(roundTripped.requests).toEqual(workspace.requests)
  })

  it.each(baseWorkspace.requests.map((r) => [r.path, r.method.toUpperCase(), r.uid]))(
    'Request %s:%s are functionally equivalent',
    (_path, _method, uid) => {
      const { base, next } = getMatchingRequest(uid)

      expect({
        ...base,
        uid: 'ignore',
        selectedSecuritySchemeUids: 'ignore',
        examples: 'ignore',
      }).toEqual({
        ...next,
        uid: 'ignore',
        selectedSecuritySchemeUids: 'ignore',
        examples: 'ignore',
      })

      /** Check that the examples all match */
      const baseRequestExamples = base.examples.map((exampleUid) => baseExamples[exampleUid])
      const nextRequestExamples = next.examples.map((exampleUid) => nextExamples[exampleUid])

      baseRequestExamples.forEach((example, idx) => {
        expect({
          ...example,
          uid: 'ignore',
          requestUid: 'ignore',
        }).toEqual({
          ...nextRequestExamples[idx],
          uid: 'ignore',
          requestUid: 'ignore',
        })
      })

      const baseSchemes = base.selectedSecuritySchemeUids.map((schemeUid) => baseSecuritySchemes[schemeUid])
      const nextSchemes = next.selectedSecuritySchemeUids.map((schemeUid) => nextSecuritySchemes[schemeUid])

      expect(
        baseSchemes.map((s) => ({
          ...s,
          uid: 'ignore',
        })),
      ).toEqual(
        nextSchemes.map((s) => ({
          ...s,
          uid: 'ignore',
        })),
      )
    },
  )
})
