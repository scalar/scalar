<script setup lang="ts">
import {
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIcon,
  useModal,
  type Icon,
  type ScalarButton as ScalarButtonType,
} from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type { SelectedSecuritySchemeUids } from '@scalar/oas-utils/entities/shared'
import type {
  Collection,
  Operation,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref, useId } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useLayout } from '@/hooks/useLayout'
import type { EnvVariable } from '@/store/active-entities'
import { useWorkspace } from '@/store/store'
import type { SecuritySchemeOption } from '@/views/Request/consts'
import {
  formatComplexScheme,
  formatScheme,
  getSchemeOptions,
  getSecurityRequirements,
} from '@/views/Request/libs'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthDataTable from './RequestAuthDataTable.vue'

const {
  collection,
  environment,
  envVariables,
  layout,
  operation,
  selectedSecuritySchemeUids,
  server,
  title,
  workspace,
} = defineProps<{
  collection: Collection
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  operation?: Operation | undefined
  selectedSecuritySchemeUids: SelectedSecuritySchemeUids
  server: Server | undefined
  title: string
  workspace: Workspace
}>()

defineSlots<{
  /** For passing actions into the auth table */
  actions: () => unknown
}>()

const { layout: clientLayout } = useLayout()
const {
  securitySchemes,
  securitySchemeMutators,
  requestMutators,
  collectionMutators,
} = useWorkspace()

const titleId = useId()

const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: SecurityScheme['uid']; label: string } | null>(
  null,
)

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
  if (!requirements.length) {
    return null
  }

  /**
   * Security is optional if one empty object exists in the array &
   * no complex auth requirements (with multiple auth)
   */
  const hasComplexRequirement = requirements.some(
    (req) => Object.keys(req).length > 1,
  )
  const isOptional =
    !hasComplexRequirement && filteredRequirements.length < requirements.length

  const icon: Icon = isOptional ? 'Unlock' : 'Lock'

  /** Dynamic text to indicate auth requirements */
  const requiredText = isOptional ? 'Optional' : 'Required'
  const nameKey =
    filteredRequirements.length === 1
      ? (() => {
          // Get the keys of the first requirement
          const keys = Object.keys(filteredRequirements[0] || {})

          // If there are multiple keys, join them with ' & '
          return keys.length > 1 ? keys.join(' & ') : keys[0] || ''
        })()
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
      if (Array.isArray(s)) {
        return formatComplexScheme(s, securitySchemes)
      }
      const scheme = securitySchemes[s ?? '']
      if (!scheme) {
        return undefined
      }
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
      return arr.length > 1
        ? (arr as SecurityScheme['uid'][])
        : (id as SecurityScheme['uid'])
    })

  // Adding new auth
  if (addNewOption?.payload) {
    // Create new scheme
    const scheme = securitySchemeMutators.add(
      addNewOption.payload,
      collection?.uid,
    )
    if (scheme) {
      _entries.push(scheme.uid)
    }
  }

  editSelectedSchemeUids(_entries)
}

const editSelectedSchemeUids = (uids: SelectedSecuritySchemeUids) => {
  // Set as selected on the collection for the modal
  if (collection.useCollectionSecurity) {
    collectionMutators.edit(collection.uid, 'selectedSecuritySchemeUids', uids)
  }
  // Set as selected on request
  else if (operation?.uid) {
    requestMutators.edit(operation.uid, 'selectedSecuritySchemeUids', uids)
  }
}

function handleDeleteScheme({ id, label }: { id: string; label: string }) {
  // We cast the type here just to make the combobox happy, TODO: we should make ID be string-like and accept brands
  selectedScheme.value = { id: id as SecurityScheme['uid'], label }
  deleteSchemeModal.show()
}

const unselectAuth = (unSelectUid?: string) => {
  if (!unSelectUid) {
    return
  }
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
      <div
        :id="titleId"
        class="inline-flex items-center gap-1">
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
      <div class="-mx-1 flex flex-1">
        <ScalarComboboxMultiselect
          class="w-72 text-xs"
          :isDeletable="clientLayout !== 'modal' && layout !== 'reference'"
          :modelValue="selectedSchemeOptions"
          multiple
          :options="schemeOptions"
          @delete="handleDeleteScheme"
          @update:modelValue="updateSelectedAuth">
          <ScalarButton
            ref="comboboxButtonRef"
            :aria-describedby="titleId"
            class="hover:bg-b-3 text-c-1 hover:text-c-1 py-0.25 h-fit px-1.5 font-normal"
            fullWidth
            variant="ghost">
            <div class="text-c-1">
              <template v-if="selectedSchemeOptions.length === 0">
                <span class="sr-only">Select</span>
                Auth Type
              </template>
              <template v-else-if="selectedSchemeOptions.length === 1">
                <span class="sr-only">Selected Auth Type:</span>
                {{ selectedSchemeOptions[0]?.label }}
              </template>
              <template v-else>
                Multiple
                <span class="sr-only">Auth Types Selected</span>
              </template>
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
      :envVariables="envVariables"
      :environment="environment"
      :layout="layout"
      :selectedSchemeOptions="selectedSchemeOptions"
      :server="server"
      :workspace="workspace">
      <template #actions>
        <slot name="actions" />
      </template>
    </RequestAuthDataTable>
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
