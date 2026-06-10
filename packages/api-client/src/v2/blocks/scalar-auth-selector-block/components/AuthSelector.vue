<script setup lang="ts">
import {
  ScalarButton,
  type ScalarButton as ScalarButtonType,
} from '@scalar/components/button'
import { ScalarComboboxMultiselect } from '@scalar/components/combobox'
import type { Icon } from '@scalar/components/icon'
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarListboxCheckbox } from '@scalar/components/listbox'
import { useModal } from '@scalar/components/modal'
import { ScalarIconCaretDown, ScalarIconTrash } from '@scalar/icons'
import type { SelectedSecurity } from '@scalar/workspace-store/entities/auth'
import type {
  AuthMeta,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { unpackProxyObject } from '@scalar/workspace-store/helpers/unpack-proxy'
import {
  isAuthOptional,
  type MergedSecuritySchemes,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OpenApiDocument,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref, useId } from 'vue'

import DeleteRequestAuthModal from '@/v2/blocks/scalar-auth-selector-block/components/DeleteRequestAuthModal.vue'
import type { OAuth2Options } from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
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
  createAnySecurityScheme = false,
  defaultOpen = true,
  isStatic = false,
  meta,
  proxyUrl,
  securityRequirements,
  securitySchemes,
  selectedSecurity,
  server,
  title,
  options,
} = defineProps<{
  environment: XScalarEnvironment
  eventBus: WorkspaceEventBus
  /** Allows adding authentication which is not in the document */
  createAnySecurityScheme?: boolean
  /** Whether the authentication disclosure should start expanded */
  defaultOpen?: boolean
  /** Creates a static disclosure that cannot be collapsed */
  isStatic?: boolean
  meta: AuthMeta
  proxyUrl: string
  securityRequirements: OpenApiDocument['security']
  securitySchemes: MergedSecuritySchemes
  selectedSecurity: SelectedSecurity | undefined
  server: ServerObject | null
  title: string
  /**  Any config options required for the OAuth2 flow */
  options?: OAuth2Options
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
    createAnySecurityScheme,
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
 *
 * The auth dropdown lists the operation's security requirements as mutually exclusive
 * OR alternatives. Picking one should replace the previous selection rather than append
 * to it, so we keep only the option the user just added and emit that single requirement.
 * An AND-combo (e.g. `apiKeyHeader & apiKeyQuery`) is a single option whose value already
 * holds both schemes, so a replacement naturally activates both at once.
 *
 * When `createAnySecurityScheme` is enabled (the collection builder, not the per-operation
 * request flow) the dropdown stays additive so users can compose several auth schemes.
 */
const handleSchemeSelection = (selected: SecuritySchemeOption[]): void => {
  // In additive mode keep every selected option; otherwise reduce to the newly added one.
  const effectiveSelection = createAnySecurityScheme
    ? selected
    : getReplacementSelection(selected)

  const existingSchemes = effectiveSelection
    .filter((option) => option.payload === undefined)
    .map((option) => unpackProxyObject(option.value, { depth: 2 }))

  const newSchemes = effectiveSelection
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

/**
 * Reduces a multiselect emission to a single requirement for replacement behavior.
 *
 * The combobox emits the full next selection on every toggle. We diff it against the
 * currently active options to find the one the user just added and select only that.
 * Deselecting the last active option (empty emission) clears the selection.
 */
const getReplacementSelection = (
  selected: SecuritySchemeOption[],
): SecuritySchemeOption[] => {
  if (selected.length === 0) {
    return []
  }

  const activeIds = new Set(
    activeSchemeOptions.value.map((option) => option.id),
  )
  const added = selected.find((option) => !activeIds.has(option.id))

  // A newly added option replaces the previous selection; otherwise keep the last entry
  // (e.g. re-selecting the only active option) so we never emit more than one requirement.
  return [added ?? selected[selected.length - 1]!]
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
    :defaultOpen
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

    <!-- Auth Dropdown (hidden when only one scheme is available) -->
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
      :options
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
