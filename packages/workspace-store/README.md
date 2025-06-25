# @scalar/workspace-store

A powerful data store for managing OpenAPI documents. This package provides a flexible solution for handling multiple OpenAPI documents in a workspace environment

## Server-Side workspace store

Server side data store which enables document chunking to reduce initial loading time specially when working with large openapi documents

#### Usage
Create a new store in SSR mode

```ts
// Create the store
const store = await createServerWorkspaceStore({
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
await store.addDocument({
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
const store = await createServerWorkspaceStore({
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
await store.addDocument({
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

### Load documents from external sources
```ts
// Initialize the store with documents from external sources
const store = await createServerWorkspaceStore({
  mode: 'static',
  documents: [
    {
      name: 'remoteFile',
      url: 'http://localhost/document.json'
    },
    {
      name: 'fsFile',
      path: './document.json'
    }
  ]
})

// Output: { openapi: 'x.x.x', ... }
console.log(store.getWorkspace().documents.remoteFile)

// Output: { openapi: 'x.x.x', ... }
console.log(store.getWorkspace().documents.fsFile)
```

## Client-Side Workspace Store

A reactive workspace store for managing OpenAPI documents with automatic reference resolution and chunked loading capabilities. Works seamlessly with server-side stores to handle large documents efficiently.

#### Usage

```ts

// Initialize a new workspace store with default document
const store = createWorkspaceStore({
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
store.addDocumentSync({
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

#### Load documents from external sources

You can only initialize the store with object literals but if you want to add documents from external sources you can use the addDocument function

```ts
const store = createWorkspaceStore()

// Load a document into the store from a remote url
await store.addDocument({
  name: 'default',
  url: 'http://localhost/document.json'
})

// Output: { openapi: 'x.x.x', ... }
console.log(store.workspace.documents.default)
```

#### Configuration

You can pass configuration object to the workspace store which is going to be applied to all the documents

```ts
const store = createWorkspaceStore({
  config: {
    "x-scalar-reference-config": {
      features: {
        showModels: true,
      },
      appearance: {
        layout: 'modern'
      },
    }
  }
})
```

You can override specific document configuration when you add the document to the store

```ts
store.addDocumentSync({
  name: 'example',
  document: {
    openapi: '3.0.0',
    info: { title: 'Example API', version: '1.0.0' },
    paths: {},
  },
  config: {
    features: {
      showModels: false,
    },
  }
})
```

To get the active document configuration you can use config getter\

```ts
// Get the configuration for the active document
console.log(store.config['x-scalar-reference-config'].features.showModels)
```

When no configuration is provided it will return the default configuration