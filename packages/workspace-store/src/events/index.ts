// biome-ignore lint/performance/noBarrelFile: Entry point for /events
export { type WorkspaceEventBus, createWorkspaceEventBus } from './bus'
export type { CollectionType } from './definitions'
export { onCustomEvent } from './listeners'
export { type ApiReferenceEvent, type ApiReferenceEvents, emitCustomEvent } from './old-definitions'
