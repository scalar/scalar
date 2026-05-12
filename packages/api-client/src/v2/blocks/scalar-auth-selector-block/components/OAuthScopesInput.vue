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
import { computed, nextTick, ref, watch } from 'vue'

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
  (e: 'update:selectedScopes', payload: { scopes: string[] }): void
  (
    e: 'upsert:scope',
    payload: Omit<ApiReferenceEvents['auth:upsert:scopes'], 'name'>,
  ): void
  (
    e: 'delete:scope',
    payload: Omit<ApiReferenceEvents['auth:delete:scopes'], 'name'>,
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

const scopeCount = computed(() => Object.keys(flow?.scopes ?? {}).length)

/** Search is only useful once the list is long enough to scan */
const showScopeSearch = computed(() => scopeCount.value >= 10)

const filteredScopes = computed(() => {
  const query = showScopeSearch.value ? searchQuery.value : ''
  if (!query) {
    return scopes.value
  }

  const regex = new RegExp(
    query
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

const setScope = (scopeKey: string, checked: boolean) => {
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

/**
 * Forces the Disclosure to remount with `defaultOpen` set so the panel auto-expands
 * the moment a brand-new scope is added. Bumping this counter is paired with toggling
 * `expandOnNextMount` so the remount opens the panel, then reverts to the default
 * closed-on-mount behavior for any future unrelated remounts (e.g. collapse on empty).
 *
 * The Disclosure `:key` is only this counter — not a separate `hasScopes` segment — so
 * adding the first scope does not remount twice (empty prefix → with-scopes prefix),
 * which would reopen with `defaultOpen=false` and collapse the panel right when rows appear.
 */
const remountKey = ref(0)
const expandOnNextMount = ref(false)

watch(hasScopes, (has, had) => {
  if (had && !has) {
    expandOnNextMount.value = false
    remountKey.value += 1
  }
})

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

/**
 * Submit handler shared by Add Scope and Edit Scope. For renames, the `upsertScope` mutator on
 * the workspace store rewrites the selection state in place, so the component does not need to
 * emit a follow-up `update:selectedScopes`.
 *
 * When adding a brand-new scope (no `oldName`), the payload sets `enable: true` so the
 * `upsertScope` mutator also adds the new scope to any selection requirement that references
 * this scheme. The Disclosure is then remounted with `defaultOpen=true` so the user
 * immediately sees (and sees selected) the scope they just added.
 */
const handleScopeFormSubmit = async (payload: {
  name: string
  description: string
  oldName?: string
}) => {
  const isAdd = !payload.oldName

  emits('upsert:scope', {
    scope: payload.name,
    description: payload.description,
    flowType,
    ...(payload.oldName ? { oldScope: payload.oldName } : {}),
    ...(isAdd ? { enable: true } : {}),
  })

  if (!isAdd) {
    return
  }

  expandOnNextMount.value = true
  remountKey.value += 1
  // Reset after the remount so subsequent unrelated remounts (e.g. when the last
  // scope is deleted) still default to a closed panel.
  await nextTick()
  expandOnNextMount.value = false
}

/**
 * Remove the scope from the flow. Selection cleanup (dropping the deleted key from any
 * currently-selected scopes) is handled by the `deleteScope` mutator on the workspace store,
 * so the component does not need to emit a follow-up `update:selectedScopes` here.
 */
const handleDeleteScope = (scopeKey: string) => {
  emits('delete:scope', { scope: scopeKey, flowType })
}
</script>

<template>
  <DataTableCell class="h-auto !max-h-[initial] min-h-8 items-center">
    <div class="flex h-fit w-full">
      <div class="text-c-1 h-full items-center"></div>
      <Disclosure
        :key="remountKey"
        as="div"
        class="bl flex w-full flex-col"
        :defaultOpen="expandOnNextMount">
        <!--
          Keep Add Scope (and other actions) outside the summary DisclosureButton.
          When there are no scopes the summary control is disabled; a native disabled
          button blocks pointer events for all descendants, which would make Add Scope unusable.
        -->
        <div
          class="group/scopes-accordion flex h-auto min-h-8 items-center gap-1.5 pr-2.25 pl-3 text-left">
          <DisclosureButton
            :class="[
              'min-w-0 flex-1 text-left',
              hasScopes ? 'hover:text-c-1 cursor-pointer' : 'cursor-default',
              (selectedScopes.length || 0) > 0 ? 'text-c-1' : 'text-c-3',
            ]"
            :disabled="!hasScopes">
            <template v-if="hasScopes">
              Scopes Selected
              {{ selectedScopes.length || 0 }} /
              {{ Object.keys(flow?.scopes ?? {}).length || 0 }}
            </template>
            <template v-else> No Scopes Defined </template>
          </DisclosureButton>

          <div class="flex shrink-0 items-center gap-1.75">
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

            <DisclosureButton
              v-if="hasScopes"
              v-slot="{ open }"
              class="text-c-3 hover:text-c-2 -m-0.5 flex shrink-0 items-center justify-center rounded p-0.5 focus-visible:outline-offset-2">
              <ScalarIcon
                class="group-hover/scopes-accordion:text-c-2"
                :icon="open ? 'ChevronDown' : 'ChevronRight'"
                size="md" />
            </DisclosureButton>
          </div>
        </div>
        <!-- Scopes List -->
        <DisclosurePanel as="template">
          <div>
            <ScalarSearchInput
              v-if="showScopeSearch"
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
                  class="box-border flex !max-h-[initial] w-full min-w-0 cursor-pointer items-stretch overflow-hidden px-0 py-0">
                  <!-- Text scrolls horizontally; action rail stays fixed -->
                  <div
                    class="no-scrollbar text-c-2 group-hover/scope-row:text-c-1 flex min-h-8 min-w-0 flex-1 items-center gap-1 overflow-x-auto px-3 py-1.5 pr-20 text-xs text-nowrap">
                    <span class="font-code shrink-0 text-xs">{{ label }}</span>
                    <template v-if="String(description ?? '').trim()">
                      <span class="shrink-0">&ndash;</span>
                      <span class="whitespace-nowrap">{{ description }}</span>
                    </template>
                  </div>
                  <div
                    class="oauth-scope-row-action-rail absolute top-0 right-0 z-[1] flex h-full min-w-[4.5rem] items-center justify-end gap-0.5 py-1 pr-2 pl-4 opacity-0 transition-opacity group-focus-within/scope-row:opacity-100 group-hover/scope-row:opacity-100"
                    @click.stop>
                    <ScalarIconButton
                      :icon="ScalarIconPencilSimple"
                      :label="`Edit ${label}`"
                      size="sm"
                      @click.stop="
                        openEditScopeModal({
                          id,
                          description: description ?? '',
                        })
                      " />
                    <ScalarIconButton
                      :icon="ScalarIconTrash"
                      :label="`Delete ${label}`"
                      size="sm"
                      @click.stop="handleDeleteScope(id)" />
                  </div>
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
/* Matches AddressBar.vue `.address-bar-bg-states` / `.fade-right` (header URL input). */
.oauth-scope-row-action-rail {
  --oauth-scope-row-rail-bg: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--oauth-scope-row-rail-bg), transparent 100%) 0%,
    color-mix(in srgb, var(--oauth-scope-row-rail-bg), transparent 20%) 30%,
    var(--oauth-scope-row-rail-bg) 100%
  );
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
