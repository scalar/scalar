<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/components/DataTable'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ADD_AUTH_OPTIONS,
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
} from '@/views/Request/consts'
import { displaySchemeFormatter } from '@/views/Request/libs'
import {
  type ScalarButton,
  type ScalarComboboxMultiselect,
  ScalarIcon,
  ScalarIconButton,
  useModal,
} from '@scalar/components'
import { isDefined } from '@scalar/oas-utils/helpers'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestExampleAuth from './RequestExampleAuth.vue'

const { selectedSecuritySchemeUids, layout = 'client' } = defineProps<{
  selectedSecuritySchemeUids: string[]
  layout?: 'client' | 'reference'
}>()

const { activeCollection, activeRequest } = useActiveEntities()
const {
  collectionMutators,
  isReadOnly,
  requestMutators,
  securitySchemes,
  securitySchemeMutators,
} = useWorkspace()

const comboboxRef = ref<typeof ScalarComboboxMultiselect | null>(null)
const comboboxButtonRef = ref<typeof ScalarButton | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | undefined>(undefined)

/** A local div to teleport the combobox to (rather than `body` which we don't control) */
const teleportId = `combobox-${nanoid()}`

/** Security requirements for the request */
const securityRequirements = computed(() => {
  const requirements =
    (layout === 'client'
      ? (activeRequest.value?.security ?? activeCollection.value?.security)
      : activeCollection.value?.security) ?? []

  /** Filter out empty objects */
  const filteredRequirements = requirements.filter((r) => Object.keys(r).length)

  return { filteredRequirements, requirements }
})

/**
 * Available schemes that can be selected by a requestExample
 *
 * Any utilized auth must have a scheme object at the collection or request level
 * In readonly mode we will use operation level schemes if they are provided
 * Otherwise we only use collection level schemes
 *
 * Currently we just filter out empty object for optional but when we add required security we shall handle it!
 */
const availableSchemes = computed(() => {
  // TODO: these are commented out for now until we decide how to handle request level requirements
  /** With optional ({}) filtered out */
  // const requestSecurity = activeRequest.value?.security?.filter(
  //   (s) => Object.keys(s).length,
  // )
  // const base =
  //   isReadOnly.value && requestSecurity?.length
  //     ? requestSecurity.map((s) => {
  //         const nameKey = Object.keys(s)[0]
  //         return (
  //           Object.values(securitySchemes).find((ss) => ss.nameKey === nameKey)
  //             ?.uid ?? ''
  //         )
  //       })
  //     : activeCollection.value?.securitySchemes

  const base = activeCollection.value?.securitySchemes
  return (base ?? []).map((s) => securitySchemes[s]).filter(isDefined)
})

/** Display formatted options for a user to select from */
const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup[]>(
  () => {
    const _availableSchemes = [...availableSchemes.value]
    const requiredSchemes = [] as typeof _availableSchemes

    // Move some availableSchemes into requiredSchemes
    securityRequirements.value.filteredRequirements.forEach((r) => {
      const i = _availableSchemes.findIndex(
        (s) => s.nameKey === Object.keys(r)[0],
      )
      if (i > -1 && _availableSchemes[i]) {
        requiredSchemes.push(_availableSchemes[i])
        _availableSchemes.splice(i, 1)
      }
    })

    const availableFormatted = _availableSchemes.map((s) =>
      displaySchemeFormatter(s),
    )
    const requiredFormatted = requiredSchemes.map((s) =>
      displaySchemeFormatter(s),
    )

    const options = [
      { label: 'Required authentication', options: requiredFormatted },
      { label: 'Available authentication', options: availableFormatted },
    ]

    // Read only mode we don't want to add new auth
    if (isReadOnly)
      return requiredFormatted.length ? options : availableFormatted

    options.push({
      label: 'Add new authentication',
      options: ADD_AUTH_OPTIONS,
    })

    return options
  },
)

/** Ensure to update the correct mutator with the selected scheme UIDs */
const editSelectedSchemeUids = (uids: string[]) => {
  if (!activeCollection.value || !activeRequest.value) return

  // Set as selected on the collection for the modal
  if (isReadOnly) {
    collectionMutators.edit(
      activeCollection.value.uid,
      'selectedSecuritySchemeUids',
      uids,
    )
  }
  // Set as selected on request
  else {
    requestMutators.edit(
      activeRequest.value.uid,
      'selectedSecuritySchemeUids',
      uids,
    )
  }
}

/** Currently selected auth schemes on the collection */
const selectedAuth = computed(() =>
  selectedSecuritySchemeUids
    .map((uid) => {
      const scheme = securitySchemes[uid ?? '']
      if (!scheme) return undefined
      return displaySchemeFormatter(scheme)
    })
    .filter(isDefined),
)

/** Update the selected auth types */
function updateSelectedAuth(entries: SecuritySchemeOption[]) {
  if (!activeCollection.value?.uid || !activeRequest.value?.uid) return

  const addNewOption = entries.find((e) => e.payload)
  const _entries = entries.filter((e) => !e.payload).map(({ id }) => id)

  // Adding new auth
  if (addNewOption?.payload) {
    // Create new scheme
    const scheme = securitySchemeMutators.add(
      addNewOption.payload,
      activeCollection.value.uid,
    )
    if (scheme) _entries.push(scheme.uid)
  }

  editSelectedSchemeUids(_entries)
}

/** Remove a single auth type from an example */
const unselectAuth = (unSelectUid: string) => {
  editSelectedSchemeUids(
    selectedSecuritySchemeUids.filter((uid) => uid !== unSelectUid),
  )
  comboboxButtonRef.value?.$el.focus()
}

function handleDeleteScheme(option: { id: string; label: string }) {
  selectedScheme.value = option
  deleteSchemeModal.show()
}

// Add new ref for active tab
const activeAuthIndex = ref(0)

// Modify computed properties to handle single active auth
const activeAuth = computed(() => {
  return selectedSecuritySchemeUids[activeAuthIndex.value] || null
})
</script>
<template>
  <form>
    <div
      v-if="selectedSecuritySchemeUids.length > 1"
      class="flex border-t h-8 gap-2.5 px-3 max-w-full overflow-x-auto">
      <button
        v-for="(schemeUid, index) in selectedSecuritySchemeUids"
        :key="schemeUid"
        class="py-1 rounded text-sm relative before:absolute before:rounded before:bg-b-3 before:opacity-0 hover:before:opacity-100 before:h-[calc(100%-4px)] before:w-[calc(100%+8px)] before:z-1 before:top-0.5 before:left-[-4px] cursor-pointer font-medium"
        :class="[
          activeAuthIndex === index
            ? 'text-c-1 border-current border-b rounded-none'
            : 'text-c-2 border-b border-transparent',
        ]"
        type="button"
        @click="activeAuthIndex = index">
        <span class="z-10 relative">{{
          displaySchemeFormatter(securitySchemes[schemeUid]).label
        }}</span>
      </button>
    </div>

    <DataTable
      v-if="activeAuth"
      class="flex-1"
      :class="layout === 'reference' && 'border-0'"
      :columns="['']">
      <RequestExampleAuth
        :layout="layout"
        :selectedSecuritySchemeUids="[activeAuth]" />
    </DataTable>

    <div
      v-if="!selectedSecuritySchemeUids.length"
      class="text-c-3 px-4 text-sm border-t-1/2 min-h-16 justify-center flex items-center bg-b-1">
      No authentication selected
    </div>

    <DeleteRequestAuthModal
      :scheme="selectedScheme"
      :state="deleteSchemeModal"
      @close="deleteSchemeModal.hide()" />
    <div :id="teleportId" />
  </form>
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

/* .references-auth-data-table :deep(table td) {
  margin: 0 9px;
  background: var(--scalar-background-2);
} */

/* More than one selected */
/* .references-auth-data-table
  :deep(table:has(.group\/delete) tr:nth-child(2) td) {
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
  border: 0.5px solid var(--scalar-border-color);
  border-bottom: none;
}
.references-auth-data-table
  :deep(table:not(:has(.group\/delete)) tr:nth-child(3) td) {
  border-radius: var(--scalar-radius) var(--scalar-radius) 0 0;
  border: 0.5px solid var(--scalar-border-color);
  border-bottom: none;
}
.references-auth-data-table :deep(table tr:last-child td) {
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  border: 0.5px solid var(--scalar-border-color);
  border-top: none;
}

.references-auth-data-table :deep(.references-auth-row:last-of-type) td {
  border-radius: 0 0 var(--scalar-radius) var(--scalar-radius);
  background: blue;
}
.references-auth-data-table :deep(.scalar-data-table-input-required) {
  background-color: var(--scalar-background-2);
  --tw-bg-base: var(--scalar-background-2);
  --tw-shadow: var(--scalar-background-2);
} */
</style>
