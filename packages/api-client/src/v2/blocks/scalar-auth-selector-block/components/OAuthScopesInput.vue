<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  ScalarButton,
  ScalarIcon,
  ScalarIconButton,
  ScalarSearchInput,
  useModal,
} from '@scalar/components'
import { ScalarIconPencilSimple, ScalarIconTrash } from '@scalar/icons'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type {
  OAuthFlow,
  OAuthFlowsObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

import {
  DataTableCell,
  DataTableCheckbox,
  DataTableRow,
} from '@/v2/components/data-table'

import OAuthScopesAddModal from './OAuthScopesAddModal.vue'

const { selectedScopes, flow, flowType } = defineProps<{
  flowType: keyof OAuthFlowsObject
  flow: OAuthFlow
  selectedScopes: string[]
}>()

const emits = defineEmits<{
  (
    e: 'update:selectedScopes',
    payload: Pick<
      ApiReferenceEvents['auth:update:selected-scopes'],
      'scopes' | 'newScopePayload' | 'editScopePayload' | 'deleteScopePayload'
    >,
  ): void
}>()

const searchQuery = ref('')

/**
 * The scope currently being edited, used to switch the shared modal into edit mode.
 * Null means the modal is in "add" mode.
 */
const editingScope = ref<{ name: string; description: string } | null>(null)

/** List of all available scopes */
const scopes = computed(() =>
  Object.entries(flow?.scopes ?? {}).map(([key, val]) => ({
    id: key,
    label: key,
    description: val,
  })),
)

const filteredScopes = computed(() => {
  if (!searchQuery.value) {
    return scopes.value
  }

  const regex = new RegExp(
    searchQuery.value
      .split('')
      .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*'),
    'i',
  )

  return scopes.value.filter(({ label, description }) =>
    regex.test(`${label} ${description}`),
  )
})

const hasScopes = computed(() => Object.keys(flow?.scopes ?? {}).length > 0)

const allScopesSelected = computed(
  () => selectedScopes.length === Object.keys(flow?.scopes ?? {}).length,
)

function setScope(scopeKey: string, checked: boolean) {
  if (checked) {
    // Select the scope
    return emits('update:selectedScopes', {
      scopes: Array.from(new Set([...selectedScopes, scopeKey])),
    })
  }

  // Deselect the scope
  emits('update:selectedScopes', {
    scopes: selectedScopes.filter((scope) => scope !== scopeKey),
  })
}

/** Select all scopes */
const selectAllScopes = () =>
  emits('update:selectedScopes', { scopes: Object.keys(flow?.scopes ?? {}) })

/** Deselect all scopes */
const deselectAllScopes = () => emits('update:selectedScopes', { scopes: [] })

const scopeFormModal = useModal()

/** Open the modal in "add new scope" mode */
const openAddScopeModal = () => {
  editingScope.value = null
  scopeFormModal.show()
}

/** Open the modal in "edit scope" mode prefilled with the chosen row */
const openEditScopeModal = (scope: { id: string; description: string }) => {
  editingScope.value = {
    name: scope.id,
    description: scope.description ?? '',
  }
  scopeFormModal.show()
}

const handleScopeFormSubmit = (payload: {
  name: string
  description: string
  oldName?: string
}) => {
  if (payload.oldName) {
    // Rename the scope in the current selection too so consumers stay in sync
    const nextSelection = selectedScopes.map((scope) =>
      scope === payload.oldName ? payload.name : scope,
    )
    emits('update:selectedScopes', {
      scopes: nextSelection,
      editScopePayload: {
        oldName: payload.oldName,
        name: payload.name,
        description: payload.description,
        flowType,
      },
    })
    return
  }

  emits('update:selectedScopes', {
    scopes: selectedScopes,
    newScopePayload: {
      name: payload.name,
      description: payload.description,
      flowType,
    },
  })
}

/** Remove the scope from the flow and from any selection that referenced it */
const handleDeleteScope = (scopeKey: string) => {
  emits('update:selectedScopes', {
    scopes: selectedScopes.filter((scope) => scope !== scopeKey),
    deleteScopePayload: {
      name: scopeKey,
      flowType,
    },
  })
}
</script>

<template>
  <DataTableCell class="h-auto !max-h-[initial] min-h-8 items-center">
    <div class="flex h-fit w-full">
      <div class="text-c-1 h-full items-center"></div>
      <Disclosure
        :key="hasScopes ? 'with-scopes' : 'empty'"
        as="div"
        class="bl flex w-full flex-col">
        <DisclosureButton
          v-slot="{ open }"
          :class="[
            'group/scopes-accordion flex h-auto min-h-8 items-center gap-1.5 pr-2.25 pl-3 text-left',
            hasScopes ? 'hover:text-c-1 cursor-pointer' : 'cursor-default',
            (selectedScopes.length || 0) > 0 ? 'text-c-1' : 'text-c-3',
          ]"
          :disabled="!hasScopes">
          <div class="flex-1">
            <template v-if="hasScopes">
              Scopes Selected
              {{ selectedScopes.length || 0 }} /
              {{ Object.keys(flow?.scopes ?? {}).length || 0 }}
            </template>
            <template v-else> No Scopes Defined </template>
          </div>
          <div class="flex items-center gap-1.75">
            <!-- Add new scope -->
            <ScalarButton
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="openAddScopeModal">
              Add Scope
            </ScalarButton>

            <!-- Deselect All -->
            <ScalarButton
              v-if="hasScopes && allScopesSelected"
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="deselectAllScopes">
              Deselect All
            </ScalarButton>

            <!-- Select All -->
            <ScalarButton
              v-if="hasScopes && !allScopesSelected"
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="selectAllScopes">
              Select All
            </ScalarButton>

            <ScalarIcon
              v-if="hasScopes"
              class="text-c-3 group-hover/scopes-accordion:text-c-2"
              :icon="open ? 'ChevronDown' : 'ChevronRight'"
              size="md" />
          </div>
        </DisclosureButton>
        <!-- Scopes List -->
        <DisclosurePanel as="template">
          <div>
            <ScalarSearchInput
              v-model="searchQuery"
              class="flex items-center text-xs" />
            <table
              class="grid max-h-40 auto-rows-auto overflow-x-hidden overflow-y-scroll"
              :style="{ gridTemplateColumns: '1fr auto' }">
              <DataTableRow
                v-for="{ id, label, description } in filteredScopes"
                :key="id"
                class="text-c-2 group/scope-row"
                @click="setScope(id, !selectedScopes.includes(id))">
                <DataTableCell
                  class="no-scrollbar hover:text-c-1 box-border flex !max-h-[initial] w-full cursor-pointer items-center gap-1 overflow-x-scroll px-3 py-1.5 text-nowrap">
                  <span class="font-code text-xs">{{ label }}</span>
                  <template v-if="String(description ?? '').trim()">
                    <span>&ndash;</span>
                    <span>{{ description }}</span>
                  </template>

                  <!-- Edit + Delete actions, revealed on row hover -->
                  <span
                    class="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within/scope-row:opacity-100 group-hover/scope-row:opacity-100">
                    <ScalarIconButton
                      class="-m-0.5 shrink-0 p-0.5"
                      :icon="ScalarIconPencilSimple"
                      :label="`Edit ${label}`"
                      size="xs"
                      @click.stop="
                        openEditScopeModal({
                          id,
                          description: description ?? '',
                        })
                      " />
                    <ScalarIconButton
                      class="-m-0.5 shrink-0 p-0.5"
                      :icon="ScalarIconTrash"
                      :label="`Delete ${label}`"
                      size="xs"
                      @click.stop="handleDeleteScope(id)" />
                  </span>
                </DataTableCell>
                <DataTableCheckbox
                  :modelValue="selectedScopes.includes(id)"
                  @update:modelValue="setScope(id, $event)" />
              </DataTableRow>
            </table>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>

    <!-- Shared add/edit scope modal -->
    <OAuthScopesAddModal
      :scope="editingScope"
      :scopes="Object.keys(flow.scopes ?? {})"
      :state="scopeFormModal"
      @submit="handleScopeFormSubmit" />
  </DataTableCell>
</template>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
