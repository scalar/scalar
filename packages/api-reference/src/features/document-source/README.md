# DocumentSource

The DocumentSource feature is responsible for managing OpenAPI/Swagger document loading, parsing, and state management in the Scalar API Reference.

It provides composables that handle document fetching, dereferencing, and workspace state management.

## Notes

- The system automatically upgrades older OpenAPI versions to 3.1
- External references are currently not supported (TODO)
- Error handling for document processing could be better
- The feature is designed to work with Vue's reactivity system

## Core Components

### useDocumentFetcher

A Vue composable that handles fetching and loading OpenAPI documents from various sources:

- URLs (with optional proxy support)
- Direct content (string or object)
- Callback functions
- Reactive configurations

```typescript
const { originalDocument } = useDocumentFetcher({
  configuration: {
    url: 'https://api.example.com/openapi.json',
    // or
    content: openApiDocument,
    // or
    content: '{"openapi": "3.1.1", … }'
    // or
    content: () => getOpenApiDocument(),
    proxyUrl: 'https://proxy.example.com'
  }
})
```

### useDocumentSource

The main composable that orchestrates document processing and state management. It:

- Manages document loading and parsing
- Handles OpenAPI version upgrades (to 3.1.0)
- Dereferences OpenAPI documents
- Maintains workspace and active entities state

```typescript
const {
  originalDocument,
  originalOpenApiVersion,
  dereferencedDocument,
  workspaceStore,
  activeEntitiesStore
} = useDocumentSource({
  configuration: ApiReferenceConfiguration
  // or
  originalDocument: string,
  dereferencedDocument: OpenAPIV3_1.Document,
})
```

## Features

- **Multiple Document Sources**: Load documents from URLs, direct content, or callbacks
- **Automatic Version Handling**: Upgrades older OpenAPI versions to 3.1.0
- **Document Processing**:
  - Normalizes document format
  - Dereferences $refs
  - Parses into internal data structure
- **State Management**:
  - Maintains original and processed document versions
  - Manages workspace state
  - Tracks active entities
- **Reactive Updates**: All document changes trigger appropriate updates throughout the system

## Usage Example

```typescript
import { useDocumentSource } from '@/features/DocumentSource'

// In your component
const {
  originalDocument,
  dereferencedDocument,
  workspaceStore
} = useDocumentSource({
  configuration: {
    url: 'https://api.example.com/openapi.json',
    proxyUrl: 'https://proxy.example.com'
  }
})

// Access the processed document
watch(dereferencedDocument, (doc) => {
  if (doc) {
    // Use the fully dereferenced document
  }
})
```
