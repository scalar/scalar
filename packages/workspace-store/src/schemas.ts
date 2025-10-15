// biome-ignore lint/performance/noBarrelFile: This is a barrel file that re-exports workspace schemas
export type { ApiDefinition } from './schemas/workspace'
export {
  type Workspace,
  type WorkspaceDocument,
  WorkspaceDocumentSchema,
  WorkspaceSchema,
} from './schemas/workspace'
