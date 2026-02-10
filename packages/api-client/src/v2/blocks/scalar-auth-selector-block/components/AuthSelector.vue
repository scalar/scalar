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
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type {
  AuthMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId } from 'vue'

import DeleteRequestAuthModal from '@/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.vue'
import { isAuthOptional } from '@/v2/blocks/scalar-auth-selector-block/helpers/is-auth-optional'
import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block/helpers/merge-security'
import {
  formatComplexScheme,
  formatScheme,
  getSecuritySchemeOptions,
  type SecuritySchemeOption,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/security-scheme'
import { CollapsibleSection } from '@/v2/components/layout'

import RequestAuthDataTable from './RequestAuthDataTable.vue'

const {
  environment,
  eventBus,
  isStatic = false,
  meta,
  proxyUrl,
  securityRequirements,
  securitySchemes,
  selectedSecurity,
  server,
  title,
} = defineProps<{
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  /** Creates a static disclosure that cannot be collapsed */
  isStatic?: boolean
  meta: AuthMeta
  proxyUrl: string
  securityRequirements: OpenApiDocument['security']
  securitySchemes: MergedSecuritySchemes
  selectedSecurity: SelectedSecurity | undefined
  server: ServerObject | null
  title: string
}>()

const titleId = useId()
const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const isDisclosureOpen = ref(false)

const deleteModal = useModal()
const schemeToDelete = ref<{
  label: string
  payload: SecurityRequirementObject
} | null>(null)

/**
 * Determines if authentication is required or optional
 *
 * Auth is optional when there is an empty security requirement and no complex requirements.
 * Complex requirements have multiple auth schemes combined (e.g., API key + OAuth).
 */
const authIndicator = computed<{ icon: Icon; text: string } | null>(() => {
  if (!securityRequirements?.length) {
    return null
  }

  const isOptional = isAuthOptional(securityRequirements)

  return {
    icon: isOptional ? 'Unlock' : 'Lock',
    text: isOptional ? 'Optional' : 'Required',
  }
})

/** All available auth scheme options for the dropdown */
const availableSchemeOptions = computed(() =>
  getSecuritySchemeOptions(
    securityRequirements ?? [],
    securitySchemes ?? {},
    selectedSecurity?.selectedSchemes ?? [],
  ),
)

/** Currently active auth schemes selected for this operation or collection */
const activeSchemeOptions = computed<SecuritySchemeOption[]>(() => {
  const schemes = selectedSecurity?.selectedSchemes
  if (!schemes?.length) {
    return []
  }

  return schemes.flatMap((requirement) => {
    const schemeNames = Object.keys(requirement)

    if (schemeNames.length === 0) {
      return []
    }

    // Complex auth requirement with multiple schemes
    if (schemeNames.length > 1) {
      return formatComplexScheme(requirement)
    }

    // Simple auth requirement with single scheme
    const schemeName = schemeNames[0]
    if (!schemeName) {
      return []
    }

    const scheme = getResolvedRef(securitySchemes?.[schemeName])
    if (!scheme) {
      return []
    }

    return formatScheme({
      name: schemeName,
      type: scheme.type,
      value: requirement,
    })
  })
})

/**
 * Opens the combobox dropdown when clicking the auth indicator badge.
 * Prevents the disclosure from toggling if it is already open.
 */
const handleAuthIndicatorClick = (event: Event): void => {
  if (isDisclosureOpen.value) {
    event.stopPropagation()
  }
  comboboxButtonRef.value?.$el.click()
}

/**
 * Updates the selected auth schemes.
 * Separates existing schemes from newly created ones for the event payload.
 */
const handleSchemeSelection = (selected: SecuritySchemeOption[]): void => {
  const existingSchemes = selected
    .filter((option) => option.payload === undefined)
    .map((option) => unpackProxyObject(option.value, { depth: 2 }))

  const newSchemes = selected
    .filter((option) => option.payload !== undefined)
    .map((option) => ({
      name: option.label,
      scheme: option.payload!,
    }))

  eventBus.emit('auth:update:selected-security-schemes', {
    selectedRequirements: existingSchemes,
    newSchemes,
    meta,
  })
}

/** Shows the delete confirmation modal for the selected scheme */
const handleDeleteRequest = (option: {
  label: string
  value: SecurityRequirementObject
}): void => {
  schemeToDelete.value = { label: option.label, payload: option.value }
  deleteModal.show()
}

/** Deletes the selected auth scheme after confirmation */
const handleDeleteConfirm = (): void => {
  if (!schemeToDelete.value) {
    return
  }

  eventBus.emit('auth:delete:security-scheme', {
    names: Object.keys(schemeToDelete.value.payload),
  })

  schemeToDelete.value = null
  deleteModal.hide()
}

defineExpose({
  authIndicator,
  selectedSchemeOptions: activeSchemeOptions,
  schemeOptions: availableSchemeOptions,
})
</script>
<template>
  <CollapsibleSection
    class="group/params relative"
    :isStatic="isStatic"
    :itemCount="activeSchemeOptions.length"
    @update:modelValue="(open) => (isDisclosureOpen = open)">
    <template #title>
      <div
        :id="titleId"
        class="inline-flex items-center gap-0.5 leading-[20px]">
        <span>{{ title }}</span>

        <span
          v-if="authIndicator"
          class="text-c-3 hover:bg-b-3 hover:text-c-1 -my-0.5 -mr-1 cursor-pointer rounded px-1 py-0.5 leading-[normal] font-normal"
          :class="{ 'text-c-1': authIndicator.text === 'Required' }"
          data-testid="auth-indicator"
          @click="handleAuthIndicatorClick">
          {{ authIndicator.text }}
        </span>
      </div>
    </template>

    <!-- Auth Dropdown -->
    <template #actions>
      <ScalarComboboxMultiselect
        class="w-72 text-xs"
        :modelValue="activeSchemeOptions"
        multiple
        :options="availableSchemeOptions"
        placement="bottom-end"
        teleport
        @delete="handleDeleteRequest"
        @update:modelValue="handleSchemeSelection">
        <ScalarButton
          ref="comboboxButtonRef"
          :aria-describedby="titleId"
          class="group/combobox-button hover:text-c-1 text-c-2 flex h-fit w-full items-center gap-1 px-0.75 py-0.25 text-base font-normal"
          variant="ghost">
          <!-- Single auth scheme selected -->
          <template v-if="activeSchemeOptions.length === 1">
            <span class="sr-only">Selected Auth Type:</span>
            {{ activeSchemeOptions[0]?.label }}
          </template>

          <!-- Multiple auth schemes selected -->
          <template v-else-if="activeSchemeOptions.length > 1">
            Multiple
            <span class="sr-only">Auth Types Selected</span>
          </template>

          <!-- No auth schemes selected -->
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
            v-if="option.isDeletable"
            class="-m-0.5 shrink-0 p-0.5 opacity-0 group-hover/item:opacity-100"
            :icon="ScalarIconTrash"
            :label="`Delete ${option.label}`"
            size="xs"
            @click.stop="handleDeleteRequest(option)" />
        </template>
      </ScalarComboboxMultiselect>
    </template>

    <!-- Auth Table -->
    <RequestAuthDataTable
      :activeAuthIndex="selectedSecurity?.selectedIndex ?? 0"
      :environment
      :eventBus
      :isStatic
      :meta
      :proxyUrl
      :securitySchemes
      :selectedSchemeOptions="activeSchemeOptions"
      :server />

    <!-- Delete Auth Modal -->
    <DeleteRequestAuthModal
      v-if="schemeToDelete"
      :label="schemeToDelete.label"
      :scheme="schemeToDelete"
      :state="deleteModal"
      @close="deleteModal.hide()"
      @delete="handleDeleteConfirm" />
  </CollapsibleSection>
</template>
