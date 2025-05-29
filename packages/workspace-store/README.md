# @scalar/workspace-store

A powerful data store for managing OpenAPI documents. This package provides a flexible solution for handling multiple OpenAPI documents in a workspace environment

## Server-Side workspace store

Server side data store which enables document chunking to reduce initial loading time specially when working with large openapi documents

#### Usage
Create a new store in SSR mode

```ts
// Create the store
const store = createServerWorkspaceStore({
  baseUrl: 'example.com',
  mode: 'ssr',
  meta: { 'x-scalar-active-document': 'document-name' },
  documents: [
    {
      name: 'document-name',
      meta: {},
      document: {
        openapi: '3.1.1',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            User: {
              $ref: '#/components/schemas/Person',
            },
          },
        },
      },
    },
  ],
})

// Add a new document to the store
store.addDocument({
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  components: {
    schemas: {
      Person: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      User: {
        $ref: '#/components/schemas/Person',
      },
    },
  },
}, {
  name: 'document-2',
  "x-scalar-active-server": "server1"
})

// Get the workspace
// Workspace is going to keep all the sparse documents
const workspace = store.getWorkspace()

// Get chucks using json pointers
const chunk = store.get('#/document-name/components/schemas/Person')

```


Create a new store in static mode

```ts
// Create the store
const store = createServerWorkspaceStore({
  directory: 'assets',
  mode: 'static',
  meta: { 'x-scalar-active-document': 'document-name' },
  documents: [
    {
      name: 'document-name',
      meta: {},
      document: {
        openapi: '3.1.1',
        info: {
          title: 'Hello World',
          version: '1.0.0',
        },
        components: {
          schemas: {
            Person: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            User: {
              $ref: '#/components/schemas/Person',
            },
          },
        },
      },
    },
  ],
})

// Add a new document to the store
store.addDocument({
  openapi: '3.1.1',
  info: {
    title: 'Hello World',
    version: '1.0.0',
  },
  components: {
    schemas: {
      Person: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
      User: {
        $ref: '#/components/schemas/Person',
      },
    },
  },
}, {
  name: 'document-2',
  "x-scalar-active-server": "server1"
})

// Generate the workspace file system
// This will write in the filesystem the workspace and all the chucks
// which can be resolved by the consumer
const workspace = await store.generateWorkspaceChunks()
```

## Client-Side Workspace Store

A reactive workspace store for managing OpenAPI documents with automatic reference resolution and chunked loading capabilities. Works seamlessly with server-side stores to handle large documents efficiently.

#### Usage

```ts

// Initialize a new workspace store with default document
const store = await createWorkspaceStore({
  documents: [
    {
      name: 'default',
      document: {
        info: {
          title: 'OpenApi document',
          version: '1.0.0',
        },
      },
    },
  ],
  meta: {
    'x-scalar-active-document': 'default',
  },
})

// Add another OpenAPI document to the workspace
store.addDocument({
  document: {
    info: {
      title: 'OpenApi document',
      version: '1.0.0',
    },
  },
  name: 'document',
})

// Get the currently active document
store.workspace.activeDocument

// Retrieve a specific document by name
store.workspace.documents['document']

// Update global workspace settings
store.update('x-scalar-dark-mode', true)

// Update settings for the active document
store.updateDocument('active', "x-scalar-active-auth", '<value>')

// Resolve and load document chunks including any $ref references
await store.resolve(['paths', '/users', 'get'])
```