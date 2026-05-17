import type { PathItemObject } from './path-item'
import type { ReferenceType } from './reference'

export type CallbackObject = Record<string, ReferenceType<PathItemObject>>
