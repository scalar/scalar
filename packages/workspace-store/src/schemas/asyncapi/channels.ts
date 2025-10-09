import { Type } from '@scalar/typebox'

import { type ChannelItem, ChannelItemSchema } from './channel-item'

// Channels Object Schema - map of channel names to channel items
const ChannelsObjectSchemaDefinition = Type.Record(Type.String(), ChannelItemSchema)

export type ChannelsObject = Record<string, ChannelItem>

// Module definition
const module = Type.Module({
  ChannelsObject: ChannelsObjectSchemaDefinition,
})

// Export schemas
export const ChannelsObjectSchema = module.Import('ChannelsObject')
