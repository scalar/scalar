<script lang="ts">
/**
 * Main "Collection" Page Component
 *
 * Displays primary document/workspace editing and viewing interface, enabling users to:
 *   - Choose a document/workspace icon
 *   - Edit the document/workspace title
 *   - Navigate among Overview, Servers, Authentication, Environment, Cookies, and Settings tabs
 *   - Interact with associated document/workspace features and settings for each tab
 */
export default {}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons/library'
import type {
  OpenApiDocument,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'
import { RouterView, useRouter } from 'vue-router'

import IconSelector from '@/components/IconSelector.vue'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'
import type { RouteProps } from '@/v2/features/app/helpers/routes'
import type {
  Environment as EnvironmentType,
  EnvironmentVariable,
} from '@/v2/features/environments'

import LabelInput from './components/LabelInput.vue'
import Tabs from './components/Tabs.vue'

const { type, layout, workspaceStore, eventBus } = defineProps<
  RouteProps & {
    /** Type of the overview page */
    type: 'document' | 'workspace'
  }
>()

const emit = defineEmits<{
  // ------- Command palette events -------
  (
    e: 'open:commandPalette',
    action?:
      | 'import'
      | 'addServer'
      | 'addCollection'
      | 'addTag'
      | 'addExample'
      | 'addOperation',
  ): void

  (e: 'update:selectedTab', value: Routes): void
  (e: 'update:title', value: string): void
  (e: 'update:icon', value: string): void

  // ------- Overview tab events -------
  (e: 'overview:update:description', value: string): void

  // ------- Servers tab events -------
  (e: 'server:delete', payload: { serverUrl: string }): void
  (
    e: 'server:update:variable',
    payload: { serverUrl: string; name: string; value: string },
  ): void

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

  // ------- Environment tab events -------
  (
    e: 'environment:reorder',
    payload: {
      draggingItem: { id: string }
      hoveredItem: { id: string }
    },
  ): void
  (e: 'environment:add', payload: { environment: EnvironmentType }): void
  (
    e: 'environment:update',
    payload: { environmentName: string; environment: Partial<EnvironmentType> },
  ): void
  (e: 'environment:delete', payload: { environmentName: string }): void
  (
    e: 'environment:add:variable',
    payload: {
      environmentName: string
      environmentVariable: Partial<EnvironmentVariable>
    },
  ): void
  (
    e: 'environment:update:variable',
    payload: {
      /** Row number */
      id: number
      /** Environment name */
      environmentName: string
      /** Payload */
      environmentVariable: Partial<EnvironmentVariable>
    },
  ): void
  (
    e: 'environment:delete:variable',
    payload: {
      /** Environment name */
      environmentName: string
      /** Row number */
      id: number
    },
  ): void
}>()

const router = useRouter()
console.log(router.currentRoute.value)

/** TODO: just document for now but adapt to workspace later */
const title = computed(
  () => workspaceStore.workspace.activeDocument?.info?.title,
)

/** Return the icon of the document/workspace */
const icon = computed(() => {
  if (type === 'document') {
    return (
      workspaceStore.workspace.documents.active?.[
        'x-scalar-client-config-icon'
      ] || 'interface-content-folder'
    )
  }
  return 'computer-device-network-lan-www'
})
</script>

<template>
  <div class="w-full md:mx-auto md:max-w-[720px]">
    <!-- Header -->
    <div
      :aria-label="`title: ${title}`"
      class="mx-auto flex h-fit w-full flex-col gap-2 pt-6 pb-3 md:mx-auto md:max-w-[720px]">
      <IconSelector
        :modelValue="icon"
        placement="bottom-start"
        @update:modelValue="
          (icon) => eventBus.emit('update:icon', { icon, type })
        ">
        <ScalarButton
          class="hover:bg-b-2 aspect-square h-7 w-7 cursor-pointer rounded border border-transparent p-0 hover:border-inherit"
          variant="ghost">
          <LibraryIcon
            class="text-c-2 size-5"
            :src="'interface-content-folder'"
            stroke-width="2" />
        </ScalarButton>
      </IconSelector>

      <div class="group relative ml-1.25">
        <LabelInput
          class="text-xl font-bold"
          :modelValue="title ?? 'asdsd'"
          :placeholder="`Untitled ${type}`"
          @update:modelValue="(value) => emit('update:title', value)" />
      </div>
    </div>

    <!-- Tabs -->
    <Tabs :type="type" />

    <!-- Router views -->
    <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
      <RouterView
        :layout="layout"
        :type="type"
        :workspaceStore="workspaceStore" />
    </div>
  </div>
</template>
