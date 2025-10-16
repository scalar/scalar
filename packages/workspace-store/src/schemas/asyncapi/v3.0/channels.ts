import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { ChannelItem } from './channel-item'
import { ChannelItemRef } from './ref-definitions'

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export const ChannelsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([ChannelItemRef, reference(ChannelItemRef)]),
)

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export type ChannelsObject = Record<string, ReferenceType<ChannelItem>>
