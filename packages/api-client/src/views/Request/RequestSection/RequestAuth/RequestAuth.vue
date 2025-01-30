<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useLayout } from '@/hooks/useLayout'
import { useWorkspace } from '@/store/store'
import type { SecuritySchemeOption } from '@/views/Request/consts'
import {
  formatComplexScheme,
  formatScheme,
  getSchemeOptions,
  getSecurityRequirements,
} from '@/views/Request/libs'
import {
  type Icon,
  ScalarButton,
  type ScalarButton as ScalarButtonType,
  ScalarComboboxMultiselect,
  ScalarIcon,
  useModal,
} from '@scalar/components'
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import type {
  Collection,
  Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthDataTable from './RequestAuthDataTable.vue'

const {
  collection,
  layout,
  operation,
  selectedSecuritySchemeUids,
  server,
  title,
  workspace,
} = defineProps<{
  collection: Collection
  layout: 'client' | 'reference'
  operation?: Operation
  selectedSecuritySchemeUids: SelectedSecuritySchemeUids
  server: Server | undefined
  title: string
  workspace: Workspace
}>()

const { layout: clientLayout } = useLayout()
const {
  securitySchemes,
  securitySchemeMutators,
  requestMutators,
  collectionMutators,
} = useWorkspace()

const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | null>(null)

/** Security requirements for the request */
const securityRequirements = computed(() => {
  const requirements = getSecurityRequirements(operation, collection)

  /** Filter out empty objects */
  const filteredRequirements = requirements.filter((r) => Object.keys(r).length)

  return { filteredRequirements, requirements }
})

/** Indicates if auth is required */
const authIndicator = computed(() => {
  const { filteredRequirements, requirements } = securityRequirements.value
  if (!requirements.length) return null

  /** Security is optional if one empty object exists in the array */
  const isOptional = filteredRequirements.length < requirements.length
  const icon: Icon = isOptional ? 'Unlock' : 'Lock'

  /** Dynamic text to indicate auth requirements */
  const requiredText = isOptional ? 'Optional' : 'Required'
  const nameKey =
    filteredRequirements.length === 1
      ? Object.keys(filteredRequirements[0] || {})[0]
      : ''
  const text = `${nameKey} ${requiredText}`

  return { icon, text }
})

/**
 * Currently selected auth schemes on the collection, we store complex auth joined by a comma to represent the array
 * in the string
 */
const selectedSchemeOptions = computed(() =>
  selectedSecuritySchemeUids
    .map((s) => {
      if (Array.isArray(s)) return formatComplexScheme(s, securitySchemes)
      const scheme = securitySchemes[s ?? '']
      if (!scheme) return undefined
      return formatScheme(scheme)
    })
    .filter(isDefined),
)

/** Update the selected auth types */
function updateSelectedAuth(entries: SecuritySchemeOption[]) {
  const addNewOption = entries.find((e) => e.payload)
  const _entries = entries
    .filter((e) => !e.payload)
    .map(({ id }) => {
      const arr = id.split(',')
      return arr.length > 1 ? arr : id
    })

  // Adding new auth
  if (addNewOption?.payload) {
    // Create new scheme
    const scheme = securitySchemeMutators.add(
      addNewOption.payload,
      collection?.uid,
    )
    if (scheme) _entries.push(scheme.uid)
  }

  editSelectedSchemeUids(_entries)
}

const editSelectedSchemeUids = (uids: SelectedSecuritySchemeUids) => {
  // Set as selected on the collection for the modal
  if (clientLayout === 'modal' || layout === 'reference') {
    collectionMutators.edit(collection.uid, 'selectedSecuritySchemeUids', uids)
  }
  // Set as selected on request
  else if (operation?.uid) {
    requestMutators.edit(operation.uid, 'selectedSecuritySchemeUids', uids)
  }
}

function handleDeleteScheme(option: { id: string; label: string }) {
  selectedScheme.value = option
  deleteSchemeModal.show()
}

const unselectAuth = (unSelectUid?: string) => {
  if (!unSelectUid) return
  const newUids = selectedSecuritySchemeUids.filter((uid) => {
    const arr = unSelectUid.split(',')
    // Handle complex auth
    if (arr.length > 1 && Array.isArray(uid) && arr.length === uid.length) {
      return uid.every((u) => !arr.includes(u))
    }
    // Standard string auth
    return uid !== unSelectUid
  })
  editSelectedSchemeUids(newUids)
  comboboxButtonRef.value?.$el.focus()
  deleteSchemeModal.hide()
}

/** Options for the security scheme dropdown */
const schemeOptions = computed(() =>
  getSchemeOptions(
    securityRequirements.value.filteredRequirements,
    collection?.securitySchemes ?? [],
    securitySchemes,
    clientLayout === 'modal' || layout === 'reference',
  ),
)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="selectedSchemeOptions.length"
    :layout="layout">
    <template #title>
      <div class="inline-flex gap-1 items-center">
        <span>{{ title }}</span>
        <!-- Authentication indicator -->
        <span
          v-if="authIndicator"
          class="text-c-3 text-xs leading-[normal]"
          :class="{ 'text-c-1': authIndicator.text === 'Required' }">
          {{ authIndicator.text }}
        </span>
      </div>
    </template>
    <template #actions>
      <div class="flex flex-1 -mx-1">
        <ScalarComboboxMultiselect
          class="text-xs w-72"
          :isDeletable="clientLayout !== 'modal' && layout !== 'reference'"
          :modelValue="selectedSchemeOptions"
          multiple
          :options="schemeOptions"
          @delete="handleDeleteScheme"
          @update:modelValue="updateSelectedAuth">
          <ScalarButton
            ref="comboboxButtonRef"
            class="h-auto px-1.5 py-0.75 hover:bg-b-3 text-c-1 hover:text-c-1 font-normal"
            fullWidth
            variant="ghost">
            <div class="text-c-1">
              {{
                selectedSchemeOptions.length === 0
                  ? 'Auth Type'
                  : selectedSchemeOptions.length === 1
                    ? selectedSchemeOptions[0]?.label
                    : 'Multiple'
              }}
            </div>
            <ScalarIcon
              class="ml-1 shrink-0"
              icon="ChevronDown"
              size="sm" />
          </ScalarButton>
        </ScalarComboboxMultiselect>
      </div>
    </template>
    <RequestAuthDataTable
      :collection="collection"
      :layout="layout"
      :selectedSchemeOptions="selectedSchemeOptions"
      :server="server"
      :workspace="workspace" />
    <DeleteRequestAuthModal
      :scheme="selectedScheme"
      :state="deleteSchemeModal"
      @close="deleteSchemeModal.hide()"
      @delete="unselectAuth(selectedScheme?.id)" />
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
