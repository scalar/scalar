<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import {
  ScalarButton,
  ScalarIcon,
  ScalarSearchInput,
  useModal,
} from '@scalar/components'
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
} from '@/components/DataTable'

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
      'scopes' | 'newScopePayload'
    >,
  ): void
}>()

const searchQuery = ref('')

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

const addNewScopeModal = useModal()
</script>

<template>
  <DataTableCell class="h-auto !max-h-[initial] min-h-8 items-center">
    <div class="flex h-fit w-full">
      <div class="text-c-1 h-full items-center"></div>
      <Disclosure
        as="div"
        class="bl flex w-full flex-col">
        <DisclosureButton
          v-slot="{ open }"
          :class="[
            'group/scopes-accordion hover:text-c-1 flex h-auto min-h-8 cursor-pointer items-center gap-1.5 pr-2.25 pl-3 text-left',
            (selectedScopes.length || 0) > 0 ? 'text-c-1' : 'text-c-3',
          ]">
          <div class="flex-1">
            Scopes Selected
            {{ selectedScopes.length || 0 }} /
            {{ Object.keys(flow?.scopes ?? {}).length || 0 }}
          </div>
          <div class="flex items-center gap-1.75">
            <!-- Add new scope -->
            <ScalarButton
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="addNewScopeModal.show()">
              Add Scope
            </ScalarButton>

            <!-- Deselect All -->
            <ScalarButton
              v-if="allScopesSelected"
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="deselectAllScopes">
              Deselect All
            </ScalarButton>

            <!-- Select All -->
            <ScalarButton
              v-if="!allScopesSelected"
              class="pr-0.75 pl-1 transition-none"
              size="sm"
              variant="ghost"
              @click.stop="selectAllScopes">
              Select All
            </ScalarButton>

            <ScalarIcon
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
                class="text-c-2"
                @click="setScope(id, !selectedScopes.includes(id))">
                <DataTableCell
                  class="no-scrollbar hover:text-c-1 box-border flex !max-h-[initial] w-full cursor-pointer items-center gap-1 overflow-x-scroll px-3 py-1.5 text-nowrap">
                  <span class="font-code text-xs">{{ label }}</span>
                  <span>&ndash;</span>
                  <span v-if="description">
                    {{ description }}
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

    <!-- Add new scope modal -->
    <OAuthScopesAddModal
      :scopes="Object.keys(flow.scopes ?? {})"
      :state="addNewScopeModal"
      @submit="
        (payload) =>
          emits('update:selectedScopes', {
            scopes: selectedScopes,
            newScopePayload: { ...payload, flowType },
          })
      " />
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
