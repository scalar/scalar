<script setup lang="ts">
import type { HttpMethod as HttpMethodType } from '@scalar/helpers/http/http-methods'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import type {
  OpenApiDocument,
  ParameterObject,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/operation'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import type { ClientLayout } from '@/hooks'
import type { EnvVariable } from '@/store'
import { createStoreEvents } from '@/store/events'
import { AddressBar, type History } from '@/v2/blocks/scalar-address-bar-block'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'
import { OperationBlock } from '@/v2/blocks/scalar-operation-block'
import { ResponseBlock } from '@/v2/blocks/scalar-response-block'

const {
  path = '/users',
  method = 'get',
  layout = 'web',
  appVersion = '1.0.0',
  server = { url: 'https://api.example.com' },
  servers = [{ url: 'https://api.example.com' }],
  history = [],
  operation = {
    responses: {
      '200': {
        description: 'Successful response',
      },
    },
    parameters: [
      {
        name: 'userId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
        },
        examples: {
          marc: {
            value: '12345',
            summary: 'An example user ID',
          },
        },
      },
    ],
  },
  exampleKey = 'marc',
  selectedContentType = 'application/json',
  security = [],
  securitySchemes = {},
  selectedSecurity = [],
  envVariables = [],
  events = createStoreEvents(),
  environment = {
    uid: '' as any,
    name: '',
    color: '',
    value: '',
  },
} = defineProps<{
  /** Application version */
  appVersion: string

  /** Current request path */
  path: string
  /** Current request method */
  method: HttpMethodType
  /** Client layout */
  layout: ClientLayout

  /** Currently selected server */
  server: ServerObject | undefined
  /** Server list available for operation/document */
  servers: ServerObject[]

  /** List of request history */
  history: History[]
  /**
   * When the request is sent from the modal, this indicates the progress percentage
   * of the request being sent.
   *
   * The amount remaining to load from 100 -> 0
   */
  requestLoadingPercentage?: number
  /** Preprocessed response */
  response?: ResponseInstance
  /** Original request instance */
  request?: Request
  /** Total number of performed requests */
  totalPerformedRequests: number

  /** Operation object */
  operation: OperationObject
  /** Currently selected example key for the current operation */
  exampleKey: string
  /** Currently selected content type for the current operation example */
  selectedContentType?: string

  /** Document defined security schemes */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected security for the current operation */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Required security for the operation/document */
  security: OpenApiDocument['security']
  /** Event bus */
  events: ReturnType<typeof createStoreEvents>

  /** TODO: to be removed once we fully migrate to the new store */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  /** Address bar events */
  (e: 'addressBar:importCurl', value: string): void
  (e: 'addressBar:update:method', payload: { method: HttpMethodType }): void
  (e: 'addressBar:update:path', payload: { path: string }): void
  (e: 'addressBar:execute'): void
  (e: 'addressBar:update:selectedServer', payload: { id: string }): void
  (
    e: 'addressBar:update:variable',
    payload: { key: string; value: string },
  ): void
  (e: 'addressBar:addServer'): void

  (e: 'operation:update:requestName', payload: { name: string }): void

  /** Auth events */
  (e: 'auth:delete', names: string[]): void
  (e: 'auth:update:securityScheme', payload: UpdateSecuritySchemeEvent): void
  (
    e: 'auth:update:selectedScopes',
    payload: { id: string[]; name: string; scopes: string[] },
  ): void
  (
    e: 'auth:update:selectedSecurity',
    payload: {
      value: NonNullable<OpenApiDocument['x-scalar-selected-security']>
      create: SecuritySchemeObject[]
    },
  ): void

  /** Parameter events */
  (
    e: 'parameters:add',
    payload: {
      type: ParameterObject['in']
      payload: Partial<{ key: string; value: string }>
    },
  ): void
  (
    e: 'parameters:update',
    payload: {
      index: number
      type: ParameterObject['in']
      payload: Partial<{ key: string; value: string; isEnabled: boolean }>
    },
  ): void
  (
    e: 'parameters:delete',
    payload: { type: ParameterObject['in']; index: number },
  ): void
  (
    e: 'parameters:deleteAll',
    payload: {
      type: ParameterObject['in']
    },
  ): void

  /** Request Body events */
  (e: 'requestBody:update:contentType', payload: { value: string }): void
  /** We use this event to update raw values */
  (e: 'requestBody:update:value', payload: { value?: string | File }): void
  /** We use this event to update  */
  (
    e: 'requestBody:add:formRow',
    payload: Partial<{ key: string; value?: string | File }>,
  ): void
  (
    e: 'requestBody:update:formRow',
    payload: {
      index: number
      payload: Partial<{ key: string; value?: string | File }>
    },
  ): void

  /** Response events */
  (e: 'response:addRequest'): void
  (e: 'response:sendRequest'): void
  (e: 'response:openCommandPalette'): void
}>()
</script>
<template>
  <div class="bg-b-1 flex h-full flex-col">
    <div
      class="lg:min-h-header flex w-full flex-wrap items-center justify-center border-b p-2 lg:p-1">
      <AddressBar
        :envVariables="envVariables"
        :environment="environment"
        :events="events"
        :history="history"
        :layout="layout"
        :method="method"
        :path="path"
        :percentage="requestLoadingPercentage"
        :server="server"
        :servers="servers"
        @addServer="emit('addressBar:addServer')"
        @execute="emit('addressBar:execute')"
        @importCurl="(value) => emit('addressBar:importCurl', value)"
        @update:method="(payload) => emit('addressBar:update:method', payload)"
        @update:path="(payload) => emit('addressBar:update:path', payload)"
        @update:selectedServer="
          (payload) => emit('addressBar:update:selectedServer', payload)
        "
        @update:variable="
          (payload) => emit('addressBar:update:variable', payload)
        " />
    </div>
    <ViewLayout>
      <ViewLayoutContent class="flex flex-1">
        <OperationBlock
          :envVariables="envVariables"
          :environment="environment"
          :exampleKey="exampleKey"
          :layout="layout"
          :method="method"
          :operation="operation"
          :path="path"
          :security="security"
          :securitySchemes="securitySchemes"
          :selectedContentType="selectedContentType"
          :selectedSecurity="selectedSecurity"
          @auth:delete="(names) => emit('auth:delete', names)"
          @auth:update:securityScheme="
            (payload) => emit('auth:update:securityScheme', payload)
          "
          @auth:update:selectedScopes="
            (payload) => emit('auth:update:selectedScopes', payload)
          "
          @auth:update:selectedSecurity="
            (payload) => emit('auth:update:selectedSecurity', payload)
          "
          @operation:update:requestName="
            (payload) => emit('operation:update:requestName', payload)
          "
          @parameters:add="(payload) => emit('parameters:add', payload)"
          @parameters:delete="(payload) => emit('parameters:delete', payload)"
          @parameters:deleteAll="
            (payload) => emit('parameters:deleteAll', payload)
          "
          @parameters:update="(payload) => emit('parameters:update', payload)"
          @requestBody:add:formRow="
            (payload) => emit('requestBody:add:formRow', payload)
          "
          @requestBody:update:contentType="
            (payload) => emit('requestBody:update:contentType', payload)
          "
          @requestBody:update:formRow="
            (payload) => emit('requestBody:update:formRow', payload)
          "
          @requestBody:update:value="
            (payload) => emit('requestBody:update:value', payload)
          " />
        <ResponseBlock
          :appVersion="appVersion"
          :events="events"
          :layout="layout"
          :request="request"
          :response="response"
          :totalPerformedRequests="totalPerformedRequests"
          @addRequest="emit('response:addRequest')"
          @openCommandPalette="emit('response:openCommandPalette')"
          @sendRequest="emit('response:sendRequest')" />
      </ViewLayoutContent>
    </ViewLayout>
  </div>
</template>
