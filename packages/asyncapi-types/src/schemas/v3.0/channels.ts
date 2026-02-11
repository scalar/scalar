import { Type } from '@scalar/typebox'

import { reference } from '@/openapi-types/v3.1/strict/reference'

import { ChannelObjectRef } from './ref-definitions'

/**
 * An object to hold a map of Channel Items. The keys are channel identifiers that can be of any string format.
 */
export const ChannelsObjectSchemaDefinition = Type.Record(
  Type.String(),
  Type.Union([ChannelObjectRef, reference(ChannelObjectRef)]),
)
