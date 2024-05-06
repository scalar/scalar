import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { filterHiddenClients } from './useHttpClients'

describe('useHttpClients', () => {
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
        // No Node.js
        ref({}),
      ),
    ).toMatchObject([])
  })
})
