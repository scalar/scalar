<script setup lang="ts">
import {
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIconButton,
  ScalarListboxCheckbox,
  useModal,
  type Icon,
  type ScalarButton as ScalarButtonType,
} from '@scalar/components'
import { ScalarIconCaretDown, ScalarIconTrash } from '@scalar/icons'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { isDefined } from '@scalar/oas-utils/helpers'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { AuthMeta } from '@scalar/workspace-store/mutators'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId } from 'vue'

import { ViewLayoutCollapse } from '@/components/ViewLayout'
import { useLayout } from '@/hooks'
import { type EnvVariable } from '@/store'
import DeleteRequestAuthModal from '@/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.vue'
import {
  formatComplexScheme,
  formatScheme,
  getSecuritySchemeOptions,
  type SecuritySchemeOption,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/security-scheme'

import RequestAuthDataTable from './RequestAuthDataTable.vue'

const {
  environment,
  envVariables,
  layout,
  server,
  title,
  security,
  selectedSecurity,
  securitySchemes,
  eventBus,
  meta,
} = defineProps<{
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  security: OpenApiDocument['security']
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  server: ServerObject | undefined
  title: string
  eventBus: WorkspaceEventBus
  meta: AuthMeta
}>()

const { layout: clientLayout } = useLayout()

const titleId = useId()

const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{
  label: string
  payload: SecurityRequirementObject
} | null>(null)
const isViewLayoutOpen = ref(false)

/** Indicates if auth is required */
const authIndicator = computed(() => {
  if (!security?.length) {
    return null
  }

  /**
   * Security is optional if one empty object exists in the array &
   * no complex auth requirements (with multiple auth)
   */
  const hasComplexRequirement = security.some(
    (req) => Object.keys(req).length > 1,
  )
  const isOptional =
    !hasComplexRequirement &&
    security.some((req) => Object.keys(req).length === 0)

  const icon: Icon = isOptional ? 'Unlock' : 'Lock'

  /** Text to indicate auth requirements */
  const text = isOptional ? 'Optional' : 'Required'

  return { icon, text }
})

/**
 * Currently selected auth schemes on the collection, we store complex auth joined by a comma to represent the array
 * in the string
 */
const selectedSchemeOptions = computed<SecuritySchemeOption[]>(() => {
  if (!selectedSecurity?.['x-schemes'].length) {
    return []
  }

  return selectedSecurity['x-schemes']
    .map((s) => {
      const schemaNames = Object.keys(s)

      if (schemaNames.length > 1) {
        return formatComplexScheme(s)
      }

      // Simple auth, get the first name of the object
      const name = schemaNames[0]

      if (!name) {
        return undefined
      }

      const scheme = getResolvedRef(securitySchemes?.[name])

      if (!scheme) {
        return undefined
      }

      // Preserve the actual selected scopes for this scheme instead of resetting to []
      return formatScheme({ name, type: scheme.type, value: s })
    })
    .filter(isDefined)
})

function handleDeleteScheme({
  label,
  value,
}: {
  label: string
  value: SecurityRequirementObject
}) {
  selectedScheme.value = { label, payload: value }
  deleteSchemeModal.show()
}

/** Options for the security scheme dropdown */
const schemeOptions = computed(() => {
  return getSecuritySchemeOptions(
    security ?? [],
    securitySchemes ?? {},
    clientLayout === 'modal' || layout === 'reference',
  )
})

const openAuthCombobox = (event: Event) => {
  // If the layout is open, we don't want it to close on auth label click
  if (isViewLayoutOpen.value) {
    event.stopPropagation()
  }

  comboboxButtonRef.value?.$el.click()
}

const updateSelectedAuth = (selected: SecuritySchemeOption[]) => {
  eventBus.emit('update:selected-security-schemes', {
    // Only include updated schemes
    updated: selected
      .filter((it) => it.payload === undefined)
      .map((s) => s.value),
    // Only include created schemes
    create: selected
      .filter((it) => it.payload !== undefined)
      .map((it) => ({
        name: it.label,
        scheme: it.payload!,
      })),
    meta,
  })
}

const deleteScheme = () => {
  if (!selectedScheme.value) {
    return
  }

  eventBus.emit('delete:security-scheme', {
    names: Object.keys(selectedScheme.value.payload),
  })

  // Clear the selected scheme to delete
  selectedScheme.value = null
  deleteSchemeModal.hide()
}

defineExpose({
  authIndicator,
  selectedSchemeOptions,
  schemeOptions,
})
</script>
<template>
  <ViewLayoutCollapse
    class="group/params relative"
    :itemCount="selectedSchemeOptions.length"
    :layout="layout"
    @update:modelValue="isViewLayoutOpen = $event">
    <template #title>
      <div
        :id="titleId"
        class="inline-flex items-center gap-0.5 leading-[20px]">
        <span>{{ title }}</span>
        <!-- Authentication indicator -->
        <span
          v-if="authIndicator"
          class="text-c-3 hover:bg-b-3 hover:text-c-1 -mr-1 cursor-pointer rounded px-1 py-0.5 text-xs leading-[normal]"
          :class="{ 'text-c-1': authIndicator.text === 'Required' }"
          data-testid="auth-indicator"
          @click="openAuthCombobox">
          {{ authIndicator.text }}
        </span>
      </div>
    </template>
    <template #actions>
      <div class="flex flex-1">
        <ScalarComboboxMultiselect
          class="w-72 text-xs"
          :modelValue="selectedSchemeOptions"
          multiple
          :options="schemeOptions"
          placement="bottom-end"
          teleport
          @delete="handleDeleteScheme"
          @update:modelValue="updateSelectedAuth">
          <ScalarButton
            ref="comboboxButtonRef"
            :aria-describedby="titleId"
            class="group/combobox-button hover:text-c-1 text-c-2 flex h-fit w-full items-center gap-1 px-0.75 py-0.25 text-base font-normal transition-transform"
            variant="ghost">
            <template v-if="selectedSchemeOptions.length === 1">
              <span class="sr-only">Selected Auth Type:</span>
              {{ selectedSchemeOptions[0]?.label }}
            </template>
            <template v-else-if="selectedSchemeOptions.length > 1">
              Multiple
              <span class="sr-only">Auth Types Selected</span>
            </template>
            <template v-else>
              <span class="sr-only">Select</span>
              Auth Type
            </template>
            <ScalarIconCaretDown
              class="size-3 shrink-0 transition-transform duration-100 group-aria-expanded/combobox-button:rotate-180"
              weight="bold" />
          </ScalarButton>
          <template #option="{ option, selected }">
            <ScalarListboxCheckbox
              multiselect
              :selected="selected" />
            <div class="min-w-0 flex-1 truncate">
              {{ option.label }}
            </div>
            <ScalarIconButton
              v-if="
                option.isDeletable ??
                (clientLayout !== 'modal' && layout !== 'reference')
              "
              class="-m-0.5 shrink-0 p-0.5 opacity-0 group-hover/item:opacity-100"
              :icon="ScalarIconTrash"
              :label="`Delete ${option.label}`"
              size="xs"
              @click.stop="handleDeleteScheme(option)" />
          </template>
        </ScalarComboboxMultiselect>
      </div>
    </template>
    <RequestAuthDataTable
      :envVariables="envVariables"
      :environment="environment"
      :layout="layout"
      :securitySchemes="securitySchemes"
      :selectedSchemeOptions="selectedSchemeOptions"
      :server="server"
      :meta="meta"
      :activeAuthIndex="selectedSecurity?.['x-selected-index'] ?? 0"
      :eventBus="eventBus" />
    <DeleteRequestAuthModal
      v-if="selectedScheme"
      :label="selectedScheme.label"
      :scheme="selectedScheme"
      :state="deleteSchemeModal"
      @close="deleteSchemeModal.hide()"
      @delete="deleteScheme" />
  </ViewLayoutCollapse>
</template>
<style scoped>
.auth-combobox-position {
  margin-left: 120px;
}
.scroll-timeline-x {
  overflow: auto;
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.fade-left,
.fade-right {
  position: sticky;
  content: '';
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  min-height: 24px;
  pointer-events: none;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 60%,
    var(--scalar-background-1) 100%
  );
  min-width: 3px;
  left: -1px;
  animation-direction: normal;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 60%,
    var(--scalar-background-1) 100%
  );
  margin-left: -20px;
  min-width: 24px;
  right: -1px;
  top: 0;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
}
</style>
