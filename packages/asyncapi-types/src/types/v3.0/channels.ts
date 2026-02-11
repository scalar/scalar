import type { ReferenceType } from '@/openapi-types/v3.1/strict/reference'

import type { ChannelObject } from './channel-item'

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export type ChannelsObject = Record<string, ReferenceType<ChannelObject>>
