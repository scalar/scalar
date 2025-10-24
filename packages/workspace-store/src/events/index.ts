// biome-ignore lint/performance/noBarrelFile: Entry point for /events
export { onCustomEvent } from './listeners'
export { type ApiReferenceEvent, type ApiReferenceEvents, emitCustomEvent } from './old-definitions'
