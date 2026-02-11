import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'

import type { ServerObject } from './server'

/**
 * An object to hold a map of Server Objects. This map can be referenced by name.
 */
export type ServersObject = Record<string, ReferenceType<ServerObject>>
