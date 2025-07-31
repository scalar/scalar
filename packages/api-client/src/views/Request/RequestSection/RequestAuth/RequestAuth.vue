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
import {
  CLIENT_LS_KEYS,
  safeLocalStorage,
} from '@scalar/helpers/object/local-storage'
import { ScalarIconCaretDown, ScalarIconTrash } from '@scalar/icons'
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
  persistAuth = false,
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
  persistAuth?: boolean
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

const titleId = useId()

const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: SecurityScheme['uid']; label: string } | null>(
  null,
)
const isViewLayoutOpen = ref(false)

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

  /** Text to indicate auth requirements */
  const text = isOptional ? 'Optional' : 'Required'

  return { icon, text }
})

/**
 * Currently selected auth schemes on the collection, we store complex auth joined by a comma to represent the array
 * in the string
 */
const selectedSchemeOptions = computed<SecuritySchemeOption[]>(() =>
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

    if (!persistAuth) {
      return
    }

    // We must convert the uids to nameKeys first
    const nameKeys = uids.map((uids) => {
      // Handle complex auth
      if (Array.isArray(uids)) {
        return uids.map((uid) => securitySchemes[uid]?.nameKey)
      }

      return securitySchemes[uids]?.nameKey
    })

    safeLocalStorage().setItem(
      CLIENT_LS_KEYS.SELECTED_SECURITY_SCHEMES,
      JSON.stringify(nameKeys),
    )
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

const openAuthCombobox = (event: Event) => {
  // If the layout is open, we don't want it to close on auth label click
  if (isViewLayoutOpen.value) {
    event.stopPropagation()
  }

  comboboxButtonRef.value?.$el.click()
}
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
          teleport
          multiple
          placement="bottom-end"
          :options="schemeOptions"
          @delete="handleDeleteScheme"
          @update:modelValue="updateSelectedAuth">
          <ScalarButton
            ref="comboboxButtonRef"
            :aria-describedby="titleId"
            class="group/combobox-button hover:text-c-1 text-c-2 flex h-fit items-center gap-1 px-0.75 py-0.25 text-base font-normal transition-transform"
            fullWidth
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
              weight="bold"
              class="size-3 shrink-0 transition-transform duration-100 group-aria-expanded/combobox-button:rotate-180" />
          </ScalarButton>
          <template #option="{ option, selected }">
            <ScalarListboxCheckbox
              :selected="selected"
              multiselect />
            <div class="min-w-0 flex-1 truncate">
              {{ option.label }}
            </div>
            <ScalarIconButton
              v-if="
                option.isDeletable ??
                (clientLayout !== 'modal' && layout !== 'reference')
              "
              size="xs"
              :label="`Delete ${option.label}`"
              :icon="ScalarIconTrash"
              @click.stop="handleDeleteScheme(option)"
              class="-m-0.5 shrink-0 p-0.5 opacity-0 group-hover/item:opacity-100" />
          </template>
        </ScalarComboboxMultiselect>
      </div>
    </template>
    <RequestAuthDataTable
      :collection="collection"
      :envVariables="envVariables"
      :environment="environment"
      :layout="layout"
      :persistAuth="persistAuth"
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
