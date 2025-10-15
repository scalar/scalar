import { Type } from '@scalar/typebox'

import { type ChannelItem, ChannelItemSchemaDefinition } from './channel-item'

// Channels Object Schema - map of channel names to channel items
export const ChannelsObjectSchemaDefinition = Type.Record(Type.String(), ChannelItemSchemaDefinition)

export type ChannelsObject = Record<string, ChannelItem>
