import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { filterHiddenClients, useHttpClientStore } from './useHttpClientStore'

describe('useHttpClientStore', () => {
  it('filters hidden targets', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'fetch',
            clients: [],
          },
        ],
        // No Node.js
        ref({ node: true }),
      ),
    ).toMatchObject([])
  })

  it('filters hidden clients from object', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'undici',
            clients: [
              {
                title: 'Axios',
                client: 'axios',
                target: 'node',
                generate: () => '',
              },
              {
                title: 'Fetch',
                client: 'fetch',
                target: 'node',
                generate: () => '',
              },
            ],
          },
        ],
        ref({
          // No fetch
          node: ['fetch'],
        }),
      ),
    ).toMatchObject([
      {
        title: 'Node.js',
        key: 'node',
        default: 'undici',
        clients: [
          {
            title: 'Axios',
            client: 'axios',
          },
        ],
      },
    ])
  })

  it('filters hidden clients from arrays', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'undici',
            clients: [
              {
                title: 'Axios',
                client: 'axios',
                target: 'node',
                generate: () => '',
              },
              {
                title: 'Fetch',
                client: 'fetch',
                target: 'node',
                generate: () => '',
              },
            ],
          },
        ],
        // No fetch
        ref(['fetch']),
      ),
    ).toMatchObject([
      {
        title: 'Node.js',
        key: 'node',
        default: 'undici',
        clients: [
          {
            title: 'Axios',
            client: 'axios',
          },
        ],
      },
    ])
  })

  it("doesn't filter anything", () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'undici',
            clients: [
              {
                title: 'Axios',
                client: 'axios',
                target: 'node',
                generate: () => '',
              },
              {
                title: 'Fetch',
                client: 'fetch',
                target: 'node',
                generate: () => '',
              },
            ],
          },
        ],
        // No fetch
        ref([]),
      ),
    ).toMatchObject([
      {
        title: 'Node.js',
        key: 'node',
        default: 'undici',
        clients: [
          {
            title: 'Axios',
            client: 'axios',
          },
          {
            title: 'Fetch',
            client: 'fetch',
          },
        ],
      },
    ])
  })

  it('filters targets without clients', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'undici',
            clients: [],
          },
        ],
        ref([]),
      ),
    ).toMatchObject([])
  })

  it('filters targets that have all clients hidden', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            default: 'undici',
            clients: [
              {
                title: 'Fetch',
                client: 'fetch',
                target: 'node',
                generate: () => '',
              },
            ],
          },
        ],
        // No fetch
        ref(['fetch']),
      ),
    ).toMatchObject([])
  })

  it.sequential('uses the fallback HTTP client', () => {
    const { httpClient, resetState } = useHttpClientStore()

    resetState()

    expect(httpClient).toStrictEqual({
      targetKey: 'shell',
      clientKey: 'curl',
    })
  })

  it.sequential('uses the specified HTTP client as the default', () => {
    const { httpClient, resetState, setDefaultHttpClient } = useHttpClientStore()

    resetState()

    setDefaultHttpClient({
      targetKey: 'node',
      clientKey: 'undici',
    })

    expect(httpClient).toStrictEqual({
      targetKey: 'node',
      clientKey: 'undici',
    })
  })

  it.sequential('uses the first available HTTP client', () => {
    const { httpClient, resetState, setExcludedClients, setDefaultHttpClient } = useHttpClientStore()

    resetState()

    setDefaultHttpClient({
      targetKey: 'shell',
      clientKey: 'curl',
    })

    setExcludedClients({
      shell: true,
    })

    expect(httpClient).toStrictEqual({
      targetKey: 'c',
      clientKey: 'libcurl',
    })
  })
})
