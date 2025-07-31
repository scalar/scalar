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
await store.addDocument({
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
await store.addDocument({
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

To get the active document configuration you can use config getter

```ts
// Get the configuration for the active document
console.log(store.config['x-scalar-reference-config'].features.showModels)
```

When no configuration is provided it will return the default configuration

#### Document Persistence and Export

The workspace store provides several methods for managing document persistence and exporting:

##### Export Document

Export the specified document in JSON or YAML format:

```ts
// Export the specified document as JSON
const jsonString = store.exportDocument('documentName', 'json')

// Export the specified document as YAML
const yamlString = store.exportDocument('documentName', 'yaml')
```

The download method returns the original, unmodified document (before any reactive wrapping) to preserve the initial structure without external references or modifications.

##### Save Document Changes

Persist the current state of the specified document back to the intermediate document (local saved version of the document):

```ts
// Save the specified document state
const excludedDiffs = store.saveDocument('documentName')

// Check if any changes were excluded from being applied
if (excludedDiffs) {
  console.log('Some changes were excluded:', excludedDiffs)
}
```

The `saveDocument` method takes the current reactive document state and persists it. It returns an array of diffs that were excluded from being applied or undefined if no specified document is available.

##### Revert Document Changes

Revert the specified document to its most recent local saved state, discarding all unsaved changes:

```ts
// Revert the specified document to its original state
store.revertDocumentChanges('documentName')
```

The `revertDocumentChanges` method restores the specified document to its initial state by copying the original document (before any modifications) back to the specified document.

**Warning:** This operation will discard all unsaved changes to the specified document.

##### Complete Example

```ts
const store = createWorkspaceStore({
  documents: [
    {
      name: 'api',
      document: {
        openapi: '3.0.0',
        info: { title: 'My API', version: '1.0.0' },
        paths: {},
      },
    },
  ],
})

// Make some changes to the document
store.workspace.documents['api'].info.title = 'Updated API Title'

// This will restore the original title since we did not commit the changes yet
store.revertDocumentChanges()
```

### Workspace State Persistence

The workspace store provides methods to persist and restore the complete workspace state, including all documents, configurations, and metadata. This is useful for saving work between sessions or sharing workspace configurations.

```ts
const client = createWorkspaceStore()
// Get the current workspace state
const currentWorkspaceState = client.exportWorkspace()

// Persist on some kind of storage

// Reload the workspace state
client.loadWorkspace(currentWorkspaceState)
```

### Replace the Entire Document

When you have a new or updated OpenAPI document and want to overwrite the existing one—regardless of which parts have changed—you can use the `replaceDocument` method. This method efficiently and atomically updates the entire document in place, ensuring that only the necessary changes are applied for optimal performance.

```ts
const client = createWorkspaceStore({
  documents: [
    {
      name: 'document-name',
      document: {
        openapi: '3.1.0',
        info: {
          title: 'Document Title',
          version: '1.0.0',
        },
        paths: {},
        components: {
          schemas: {},
        },
        servers: [],
      },
    },
  ],
})

// Update the document with the new changes
client.replaceDocument('document-name', {
  openapi: '3.1.0',
  info: {
    title: 'Updated Document',
    version: '1.0.0',
  },
  paths: {},
  components: {
    schemas: {},
  },
  servers: [],
})
```

### Create workspace from specification

Create the workspace from a specification object

```ts
await store.importWorkspaceFromSpecification({
  workspace: 'draft',
  info: { title: 'My Workspace' },
  documents: {
    api: { $ref: '/examples/api.yaml' },
    petstore: { $ref: '/examples/petstore.yaml' },
  },
  overrides: {
    api: {
      servers: [
        {
          url: 'http://localhost:9090',
        },
      ],
    },
  },
  'x-scalar-dark-mode': true,
})
```

### Override specific fields from the document and it's metadata

This feature is helpful when you want to override specific fields in a document without altering the original source. Overrides allow you to customize certain values in-memory, ensuring the original document remains unchanged.

```ts
const store = createWorkspaceStore()
await store.addDocument({
  name: 'default',
  document: {
    openapi: '3.1.0',
    info: {
      title: 'Document Title',
      version: '1.0.0',
    },
    paths: {},
    components: {
      schemas: {},
    },
    servers: [],
  },
  // Override the servers field
  overrides: {
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Default dev server'
      }
    ]
  }
})
```

When you override specific fields, those changes are applied only in-memory and will never be written back to the original document. The original source remains unchanged, and any modifications made through overrides are isolated to the current session.

### Rebase document origin with the updated remote origin

Rebases a document in the workspace with a new origin, resolving conflicts if provided.

```ts
// Example: Rebase a document with a new origin and resolve conflicts
const conflicts = store.rebaseDocument('api', newOriginDoc)
if (conflicts && conflicts.length > 0) {
  // User resolves conflicts here...
  store.rebaseDocument('api', newOriginDoc, userResolvedConflicts)
}
```