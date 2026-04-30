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
await store.addDocument(
  {
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
  {
    'name': 'document-2',
    'x-scalar-selected-server': 'server1',
  },
)

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
await store.addDocument(
  {
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
  {
    'name': 'document-2',
    'x-scalar-selected-server': 'server1',
  },
)

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
      url: 'http://localhost/document.json',
    },
    {
      name: 'fsFile',
      path: './document.json',
    },
  ],
})

// Output: { openapi: 'x.x.x', ... }
console.log(store.getWorkspace().documents.remoteFile)

// Output: { openapi: 'x.x.x', ... }
console.log(store.getWorkspace().documents.fsFile)
```

## Client-Side Workspace Store

A reactive workspace store for managing OpenAPI documents with automatic reference resolution and chunked loading capabilities. Works seamlessly with server-side stores to handle large documents efficiently.

#### Usage

The client-side store starts empty and exposes `addDocument` for loading documents in. Workspace metadata, plugins, fetch overrides, and a file loader plugin can be supplied at construction time.

```ts
// Initialize a new (empty) workspace store
const store = createWorkspaceStore({
  meta: {
    'x-scalar-active-document': 'default',
  },
})

// Add the default document
await store.addDocument({
  name: 'default',
  document: {
    openapi: '3.1.0',
    info: {
      title: 'OpenApi document',
      version: '1.0.0',
    },
  },
})

// Add another OpenAPI document to the workspace
await store.addDocument({
  name: 'document',
  document: {
    openapi: '3.1.0',
    info: {
      title: 'Another document',
      version: '1.0.0',
    },
  },
})

// Get the currently active document
store.workspace.activeDocument

// Retrieve a specific document by name
store.workspace.documents['document']

// Update global workspace settings
store.update('x-scalar-color-mode', true)

// Update settings for the active document
store.updateDocument('active', 'x-scalar-selected-server', 'production')

// Resolve and load document chunks including any $ref references
await store.resolve(['paths', '/users', 'get'])
```

#### Load documents from external sources

The store can also load documents from a URL or, when a file loader plugin is configured, from the local filesystem. Each call returns a boolean indicating whether the document was added successfully.

```ts
const store = createWorkspaceStore()

// Load a document into the store from a remote url
await store.addDocument({
  name: 'default',
  url: 'http://localhost/document.json',
})

// Output: { openapi: 'x.x.x', ... }
console.log(store.workspace.documents.default)
```

#### Document Persistence and Export

The workspace store keeps two snapshots per document at runtime: the **original** (the last saved baseline that the user committed to with `saveDocument`) and the **active** document (the reactive in-memory state, which may include unsaved edits). Most persistence methods are anchored on those two snapshots.

> **Deprecated:** an additional `intermediateDocuments` map and the helper methods `getIntermediateDocument` / `promoteIntermediateToOriginal` still exist for backward compatibility but are no longer authoritative. New code should rely on `getOriginalDocument` and the active document instead. The intermediate map is kept in sync on save / revert / rebase so existing consumers keep working until the layer is removed.

##### Export Document

Export the specified document in JSON or YAML format. The export reads from the saved baseline (the same content `revertDocumentChanges` would restore), so it always reflects the user's last save rather than any unsaved edits.

```ts
// Export the specified document as JSON
const jsonString = store.exportDocument('documentName', 'json')

// Export the specified document as YAML
const yamlString = store.exportDocument('documentName', 'yaml')

// Or export the currently active document directly
const activeJson = store.exportActiveDocument('json')
```

##### Save Document Changes

`saveDocument` promotes the current in-memory document to the new saved baseline. It serialises the reactive workspace document back into a plain shape (with bundler-internal keys stripped), writes it into the original-document map, and clears the document's `x-scalar-is-dirty` flag.

```ts
// Save the specified document state
const ok = await store.saveDocument('documentName')

if (!ok) {
  console.warn('Document does not exist or could not be serialised')
}
```

`saveDocument` returns `true` on success and `false` when the document does not exist or cannot be serialised back into the original map.

##### Revert Document Changes

Revert the specified document to its most recent saved baseline, discarding all unsaved in-memory changes.

```ts
// Revert the specified document to its last saved state
await store.revertDocumentChanges('documentName')
```

The `revertDocumentChanges` method restores the active document from the original-document map, which is whatever `saveDocument` last wrote (or the document as it was first loaded into the workspace if it has never been saved).

**Warning:** This operation will discard all unsaved changes to the specified document.

##### Complete Example

```ts
const store = createWorkspaceStore()
await store.addDocument({
  name: 'api',
  document: {
    openapi: '3.0.0',
    info: { title: 'My API', version: '1.0.0' },
    paths: {},
  },
})

// Make some changes to the document
store.workspace.documents['api'].info.title = 'Updated API Title'

// Restore the saved baseline since the changes were never saved
await store.revertDocumentChanges('api')
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
const client = createWorkspaceStore()
await client.addDocument({
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
})

// Update the document with the new changes
await client.replaceDocument('document-name', {
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
  'workspace': 'draft',
  'info': { title: 'My Workspace' },
  'documents': {
    api: { $ref: '/examples/api.yaml' },
    petstore: { $ref: '/examples/petstore.yaml' },
  },
  'overrides': {
    api: {
      servers: [
        {
          url: 'http://localhost:9090',
        },
      ],
    },
  },
  'x-scalar-color-mode': true,
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
        description: 'Default dev server',
      },
    ],
  },
})
```

When you override specific fields, those changes are applied only in-memory and will never be written back to the original document. The original source remains unchanged, and any modifications made through overrides are isolated to the current session.

### Rebase document origin with the updated remote origin

`rebaseDocument` reconciles a workspace document with a new upstream origin. It performs a two-way merge between:

- the **incoming changes** — `diff(originalDocument, newOrigin)`
- the **local changes** — `diff(originalDocument, activeDocument)`

The call returns a discriminated result. On `ok: false` the `type` field describes why the rebase did not run (`CORRUPTED_STATE`, `FETCH_FAILED`, or `NO_CHANGES_DETECTED`). On `ok: true` it exposes the auto-mergeable `changes`, the `conflicts` that need user input, and an `applyChanges` callback that writes the merged result back into the workspace.

```ts
// Fetch the latest origin and start a rebase
const result = await store.rebaseDocument({
  name: 'api',
  // Any `WorkspaceDocumentInput` is accepted - inline document, url, or path
  url: 'https://example.com/api/openapi.json',
})

if (!result.ok) {
  console.warn(`Rebase did not run: ${result.type}`)
  return
}

if (result.conflicts.length === 0) {
  // No conflicts - just apply with an empty resolution set
  await result.applyChanges({ resolvedConflicts: [] })
  return
}

// Surface the conflicts to the user. Each conflict is a tuple of
// [incomingDiffs, localDiffs] - resolve by picking either side, or by
// providing a fully resolved document.
const resolvedConflicts = result.conflicts.flatMap(([incoming]) => incoming)
await result.applyChanges({ resolvedConflicts })

// Or, pass a complete document to use as-is (overrides the merge result):
await result.applyChanges({ resolvedDocument: newDocument })
```

After `applyChanges` returns, the merged document becomes both the new active document and the new saved baseline, so a subsequent `revertDocumentChanges` rolls back to the post-rebase state rather than the pre-rebase original.
