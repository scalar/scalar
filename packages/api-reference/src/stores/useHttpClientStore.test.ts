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
            extname: '.js',
            default: 'foobar',
            clients: [
              {
                title: 'Axios',
                key: 'axios',
                description:
                  'Promise based HTTP client for the browser and node.js',
                link: 'https://example.com',
              },
              {
                title: 'Fetch',
                key: 'fetch',
                description:
                  'The Fetch API provides an interface for fetching resources',
                link: 'https://example.com',
              },
            ],
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
            extname: '.js',
            default: 'foobar',
            clients: [
              {
                title: 'Axios',
                key: 'axios',
                description:
                  'Promise based HTTP client for the browser and node.js',
                link: 'https://example.com',
              },
              {
                title: 'Fetch',
                key: 'fetch',
                description:
                  'The Fetch API provides an interface for fetching resources',
                link: 'https://example.com',
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
        extname: '.js',
        default: 'foobar',
        clients: [
          {
            title: 'Axios',
            key: 'axios',
            description:
              'Promise based HTTP client for the browser and node.js',
            link: 'https://example.com',
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
            extname: '.js',
            default: 'foobar',
            clients: [
              {
                title: 'Axios',
                key: 'axios',
                description:
                  'Promise based HTTP client for the browser and node.js',
                link: 'https://example.com',
              },
              {
                title: 'Fetch',
                key: 'fetch',
                description:
                  'The Fetch API provides an interface for fetching resources',
                link: 'https://example.com',
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
        extname: '.js',
        default: 'foobar',
        clients: [
          {
            title: 'Axios',
            key: 'axios',
            description:
              'Promise based HTTP client for the browser and node.js',
            link: 'https://example.com',
          },
        ],
      },
    ])
  })

  it('doesn’t filter anything', () => {
    expect(
      filterHiddenClients(
        [
          {
            title: 'Node.js',
            key: 'node',
            extname: '.js',
            default: 'foobar',
            clients: [
              {
                title: 'Axios',
                key: 'axios',
                description:
                  'Promise based HTTP client for the browser and node.js',
                link: 'https://example.com',
              },
              {
                title: 'Fetch',
                key: 'fetch',
                description:
                  'The Fetch API provides an interface for fetching resources',
                link: 'https://example.com',
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
        extname: '.js',
        default: 'foobar',
        clients: [
          {
            title: 'Axios',
            key: 'axios',
            description:
              'Promise based HTTP client for the browser and node.js',
            link: 'https://example.com',
          },
          {
            title: 'Fetch',
            key: 'fetch',
            description:
              'The Fetch API provides an interface for fetching resources',
            link: 'https://example.com',
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
            extname: '.js',
            default: 'foobar',
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
            extname: '.js',
            default: 'foobar',
            clients: [
              {
                title: 'Fetch',
                key: 'fetch',
                description:
                  'The Fetch API provides an interface for fetching resources',
                link: 'https://example.com',
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
    const { httpClient, resetState, setDefaultHttpClient } =
      useHttpClientStore()

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
    const { httpClient, resetState, setExcludedClients, setDefaultHttpClient } =
      useHttpClientStore()

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
