import { Type } from '@scalar/typebox'

import { type ReferenceType, reference } from '@/schemas/v3.1/strict/reference'

import type { ChannelObject } from './channel-item'
import { ChannelObjectRef } from './ref-definitions'

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export const ChannelsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([ChannelObjectRef, reference(ChannelObjectRef)]),
)

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export type ChannelsObject = Record<string, ReferenceType<ChannelObject>>
