import type { WorkspaceStore } from '@scalar/workspace-store/client'

export type ClientActionHandler = (ctx: { store: WorkspaceStore }) => Promise<void> | void
