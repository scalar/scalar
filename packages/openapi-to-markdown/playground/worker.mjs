import { register } from 'tsx/esm/api'

// Register inside the worker; parent-process loader hooks do not carry over.
register()
await import('./worker.ts')
