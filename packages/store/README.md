# @scalar/store

Server side data store for openapi documents

## Usage

Create a new store in ssr mode

```ts
// Create the store
const store = createServerWorkspace({
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


Create a new store in ssr mode

```ts
// Create the store
const store = createServerWorkspace({
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
const workspace = store.generateWorkspaceChunks()
```