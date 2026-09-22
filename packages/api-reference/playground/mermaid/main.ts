import '@/style.css'

import { createApiReference } from '@/standalone/lib/html-api'

const plugins = new URLSearchParams(window.location.search).has('withoutPlugin')
  ? []
  : [(await import('../../../mermaid-plugin/src')).mermaidPlugin()]

const graph = '```mermaid\nflowchart LR\n  Request --> Authentication\n  Authentication --> Response\n```'
createApiReference('#app', {
  plugins,
  content: {
    openapi: '3.1.0',
    info: {
      title: 'Interactive diagrams',
      version: '1.0.0',
      description: `Explore your API flows with Mermaid.\n\n${graph}`,
    },
    paths: {
      '/orders': {
        get: {
          summary: 'List orders',
          description: graph,
          parameters: [{ name: 'status', in: 'query', description: graph, schema: { type: 'string' } }],
          responses: { '200': { description: `Order flow\n\n${graph}` } },
        },
      },
    },
    components: {
      schemas: {
        Order: { type: 'object', description: graph, properties: { id: { type: 'string', description: graph } } },
      },
    },
  },
})
