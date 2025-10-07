// biome-ignore lint/performance/noBarrelFile: This is a barrel file that re-exports workspace schemas

// Export AsyncAPI schemas and types
export * from './schemas/asyncapi'
// Export union types and type guards
export type { ApiDefinition } from './schemas/workspace'
export {
  type Workspace,
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  WorkspaceSchema,
  isAsyncApiDocument,
  isOpenApiDocument,
} from './schemas/workspace'
