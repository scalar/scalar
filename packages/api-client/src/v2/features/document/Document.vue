<script setup lang="ts">
/**
 * Document page
 *
 * This component represents the main document page where users can view and edit document details.
 * It includes features such as selecting document icons, editing document titles, and navigating through different tabs
 * like Overview, Servers, Authentication, Environment, and Settings.
 *
 * Props:
 * - selectedTab: The currently selected tab (default is 'overview').
 * - icon: The icon representing the document (default is 'interface-content-folder').
 * - title: The title of the document.
 */
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type { Environment as EnvironmentType } from '@scalar/oas-utils/entities/environment'
import type {
  OpenApiDocument,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'

import LabelInput from '@/components/Form/LabelInput.vue'
import IconSelector from '@/components/IconSelector.vue'
import type { EnvVariable } from '@/store'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'
import Overview from '@/v2/features/document/components/Overview.vue'

import Authentication from './components/Authentication.vue'
import Environment from './components/Environment.vue'
import Servers from './components/Servers.vue'
import Settings from './components/Settings.vue'
import Tabs, { type Routes } from './components/Tabs.vue'

const {
  selectedTab = 'authentication',
  title = 'Document Name',
  icon = 'interface-content-folder',
} = defineProps<{
  /** Currently selected tab */
  selectedTab: Routes
  /** Document icon */
  icon?: string
  /** Document title */
  title: string

  // ------- Settings tab props -------
  /** Document source url if available */
  documentUrl?: string
  /** Watch mode status if also document url is provided */
  watchMode?: boolean

  // ------- Authentication tab props -------
  /** Should use document security */
  useDocumentSecurity: boolean
  /** Security requirements for the document */
  security: OpenApiDocument['security']
  /** Currently selected security requirements */
  selectedSecurity: OpenApiDocument['security']
  /** Security schemes available in the document */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected server */
  server: ServerObject | undefined

  // ------- To be removed -------
  /** TODO: remove when we migrate */
  environment: EnvironmentType
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedTab', value: Routes): void
  (e: 'update:documentTitle', value: string): void
  (e: 'update:documentIcon', value: string): void

  // ------- Settings tab events -------
  (e: 'settings:deleteDocument'): void
  (e: 'settings:update:watchMode', value: boolean): void

  // ------- Authentication tab events -------
  (e: 'auth:update:useDocumentSecurity', value: boolean): void
  (e: 'auth:deleteOperationAuth', names: string[]): void
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
}>()
</script>

<template>
  <div class="w-full md:mx-auto md:max-w-[720px]">
    <!-- Document title and icon -->
    <div
      :aria-label="`Document: ${title}`"
      class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="(value) => emit('update:documentIcon', value)">
        <ScalarButton
          class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
          variant="ghost">
          <LibraryIcon
            class="text-c-2 size-5"
            :src="icon"
            stroke-width="2" />
        </ScalarButton>
      </IconSelector>
      <div class="group relative ml-1.25">
        <LabelInput
          class="text-xl font-bold"
          inputId="documentName"
          placeholder="Untitled Document"
          :value="title"
          @updateValue="(value) => emit('update:documentTitle', value)" />
      </div>
    </div>
    <!-- Tabs -->
    <Tabs
      :selectedTab="selectedTab"
      @update:selectedTab="(tab) => emit('update:selectedTab', tab)" />
    <!-- Tab views -->
    <!-- Document Overview -->
    <Overview v-if="selectedTab === 'overview'" />
    <!-- Document Servers -->
    <Servers v-else-if="selectedTab === 'servers'" />
    <!-- Document Authentication -->
    <Authentication
      v-else-if="selectedTab === 'authentication'"
      :envVariables="envVariables"
      :environment="environment"
      :security="security"
      :securitySchemes="securitySchemes"
      :selectedSecurity="selectedSecurity"
      :server="server"
      :useDocumentSecurity="useDocumentSecurity"
      @deleteOperationAuth="(names) => emit('auth:deleteOperationAuth', names)"
      @update:securityScheme="
        (payload) => emit('auth:update:securityScheme', payload)
      "
      @update:selectedScopes="
        (payload) => emit('auth:update:selectedScopes', payload)
      "
      @update:selectedSecurity="
        (payload) => emit('auth:update:selectedSecurity', payload)
      "
      @update:useDocumentSecurity="
        (value) => emit('auth:update:useDocumentSecurity', value)
      " />
    <!-- Document Environments -->
    <Environment v-else-if="selectedTab === 'environment'" />
    <!-- Document Settings -->
    <Settings
      v-else-if="selectedTab === 'settings'"
      :documentUrl="documentUrl"
      :title="title"
      :watchMode="watchMode"
      @deleteDocument="emit('settings:deleteDocument')"
      @update:watchMode="(value) => emit('settings:update:watchMode', value)" />
    <!-- Tab views end -->
  </div>
</template>
