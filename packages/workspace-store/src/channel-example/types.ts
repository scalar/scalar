import type { AsyncApiChannelObject, AsyncApiOperationObject } from '@scalar/types/asyncapi/3.1'

import type { SelectedSecurity } from '@/entities/auth'
import type { AuthMeta } from '@/events'
import type { SecuritySchemeObjectSecret } from '@/request-example/builder/security/secret-types'
import type { MergedSecuritySchemes } from '@/request-example/context/security/merge-security'
import type { XScalarEnvironment } from '@/schemas/extensions/document/x-scalar-environments'
import type { SecurityRequirementObject } from '@/schemas/v3.1/strict/security-requirement'

import type { ChannelMessageEntry } from './get-channel-messages'
import type { ChannelParametersContext } from './get-channel-parameters'
import type { AsyncApiServerEntry } from './servers'

export type ChannelExampleMeta = {
  operationName: string
}

export type BuildChannelExampleContext = {
  operation: AsyncApiOperationObject
  channel: AsyncApiChannelObject
  channelName: string
  channelAddress: string
  messages: ChannelMessageEntry[]
  selectedMessage: ChannelMessageEntry | null
  servers: {
    list: AsyncApiServerEntry[]
    selected: AsyncApiServerEntry | null
  }
  connectionUrl: string
  parameters: ChannelParametersContext
  security: {
    schemes: MergedSecuritySchemes
    requirements: SecurityRequirementObject[]
    selected: SelectedSecurity
    selectedSchemes: SecuritySchemeObjectSecret[]
    meta: AuthMeta
  }
  environment: {
    name: string | null
    environment: XScalarEnvironment
  }
}
