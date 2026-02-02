<script setup lang="ts">
import type {
  ApiReferenceEvents,
  AuthMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block'
import type { SecuritySchemeOption } from '@/v2/blocks/scalar-auth-selector-block/helpers/security-scheme'
import { DataTable } from '@/v2/components/data-table'

import RequestAuthTab from './RequestAuthTab.vue'

const {
  environment,
  isStatic,
  selectedSchemeOptions,
  activeAuthIndex,
  securitySchemes = {},
  server,
  eventBus,
  meta,
} = defineProps<{
  /** The current environment configuration */
  environment: XScalarEnvironment
  /** Controls border display for static (non-collapsible) layouts */
  isStatic: boolean
  /** Available authentication scheme options */
  selectedSchemeOptions: SecuritySchemeOption[]
  /** Index of the currently active authentication tab */
  activeAuthIndex: number
  /** Proxy URL */
  proxyUrl: string
  /** OpenAPI security scheme definitions */
  securitySchemes: MergedSecuritySchemes
  /** Current server configuration */
  server: ServerObject | null
  /** Event bus for authentication updates */
  eventBus: WorkspaceEventBus
  /** Metadata for authentication context */
  meta: AuthMeta
}>()

/** Currently selected authentication scheme based on the active tab index */
const activeScheme = computed<SecuritySchemeOption | undefined>(
  () => selectedSchemeOptions[activeAuthIndex],
)

/**
 * Whether to display multiple authentication tabs.
 * Only shows tabs when there are 2 or more schemes available.
 */
const shouldShowTabs = computed<boolean>(() => selectedSchemeOptions.length > 1)

/** Handles authentication tab selection */
const handleTabChange = (index: number) =>
  eventBus.emit('auth:update:active-index', {
    index,
    meta,
  })

/** Handles updates to OAuth scope selection */
const handleScopesUpdate = (
  params: Omit<ApiReferenceEvents['auth:update:selected-scopes'], 'meta'>,
): void =>
  eventBus.emit('auth:update:selected-scopes', {
    ...params,
    meta,
  })

/** Determines if a tab is currently active */
const isTabActive = (index: number): boolean => activeAuthIndex === index

/** Expose the active scheme for parent component access */
defineExpose({
  activeScheme,
})
</script>

<template>
  <form @submit.prevent>
    <!-- Authentication Tabs -->
    <div
      v-if="shouldShowTabs"
      class="box-content flex flex-wrap gap-x-2.5 overflow-hidden border border-b-0 px-3"
      :class="{ 'border-x-0': !isStatic }"
      data-testid="auth-tabs">
      <div
        v-for="(option, index) in selectedSchemeOptions"
        :key="option.id"
        class="relative z-1 -mb-[var(--scalar-border-width)] flex h-8">
        <button
          class="floating-bg relative cursor-pointer border-b border-transparent py-1 text-sm font-medium transition-colors"
          :class="isTabActive(index) ? 'text-c-1' : 'text-c-3'"
          type="button"
          @click="handleTabChange(index)">
          <span class="relative z-10 font-medium whitespace-nowrap">
            {{ option.label }}
          </span>
        </button>

        <!-- Active Tab Indicator -->
        <div
          v-if="isTabActive(index)"
          class="absolute inset-x-1 bottom-[var(--scalar-border-width)] left-1/2 z-1 h-px w-full -translate-x-1/2 bg-current" />
      </div>
    </div>

    <!-- Active Authentication Scheme Content -->
    <DataTable
      v-if="activeScheme"
      class="flex-1"
      :class="{ 'bg-b-1 rounded-b-lg border border-t-0': isStatic }"
      :columns="['']"
      presentational>
      <RequestAuthTab
        :environment
        :eventBus
        :isStatic
        :proxyUrl
        :securitySchemes
        :selectedSecuritySchemas="activeScheme.value"
        :server
        @update:selectedScopes="handleScopesUpdate" />
    </DataTable>

    <!-- Empty State -->
    <div
      v-else
      class="bg-b-1 text-c-3 flex min-h-16 items-center justify-center border-t px-4 text-sm"
      :class="{ 'min-h-[calc(4rem+0.5px)] rounded-b-lg border': isStatic }">
      No authentication selected
    </div>
  </form>
</template>
