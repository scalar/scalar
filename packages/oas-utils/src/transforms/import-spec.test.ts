/**
 * @vitest-environment jsdom
 */
import { importSpecToWorkspace } from '@/transforms/import-spec'
import galaxy from '@scalar/galaxy/latest.json'
import circular from '@test/fixtures/basic-circular-spec.json'
import petstoreMod from '@test/fixtures/petstore-tls.json'
import { describe, expect, it, test, vi } from 'vitest'

describe('Import OAS Specs', () => {
  test('Handles circular', async () => {
    const res = await importSpecToWorkspace(circular)

    // console.log(JSON.stringify(res, null, 2))
    if (res.error) return

    expect(res.requests[0].path).toEqual('/api/v1/updateEmployee')
    expect(res.tags[0].children.includes(res.tags[1].uid)).toEqual(true)
    expect(
      res.tags[0].children.includes(Object.values(res.requests)[0].uid),
    ).toEqual(true)
  })

  test('Handles weird petstore', async () => {
    const res = await importSpecToWorkspace(petstoreMod)

    expect(res.error).toBe(false)
  })

  // Causes cyclic dependency
  test('Loads galaxy spec', async () => {
    const res = await importSpecToWorkspace(galaxy)

    expect(res.error).toEqual(false)
  })

  // Servers
  describe('servers', () => {
    it('vanilla servers are returned', async () => {
      const res = await importSpecToWorkspace(galaxy)
      if (res.error) throw res.error

      // Remove the UID for comparison
      expect(res.servers.map(({ uid, ...rest }) => rest)).toEqual(
        galaxy.servers,
      )
    })

    /** Galaxy with some relative servers */
    const relativeGalaxy = {
      ...galaxy,
      servers: [
        ...galaxy.servers,
        {
          url: '/api/v1',
        },
        {},
      ],
    }

    it('handles relative servers with window.location.origin', async () => {
      const res = await importSpecToWorkspace(relativeGalaxy)
      if (res.error) throw res.error

      // Test URLS only
      expect(res.servers.map(({ url }) => url)).toEqual([
        'https://galaxy.scalar.com',
        '{protocol}://void.scalar.com/{path}',
        'http://localhost:3000/api/v1',
        'http://localhost:3000',
      ])
    })

    it('handles baseServerURL for relative servers', async () => {
      const res = await importSpecToWorkspace(relativeGalaxy, {
        baseServerURL: 'https://scalar.com',
      })
      if (res.error) throw res.error

      // Test URLS only
      expect(res.servers.map(({ url }) => url)).toEqual([
        'https://galaxy.scalar.com',
        '{protocol}://void.scalar.com/{path}',
        'https://scalar.com/api/v1',
        'https://scalar.com',
      ])
    })
  })
})
