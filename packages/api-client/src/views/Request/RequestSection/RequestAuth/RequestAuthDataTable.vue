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
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIcon,
  ScalarIconButton,
  useModal,
} from '@scalar/components'
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
  return (base ?? []).map((s) => securitySchemes[s]).filter((s) => s)
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
      if (i > -1) {
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
  selectedSecuritySchemeUids.map((uid) =>
    displaySchemeFormatter(securitySchemes[uid]),
  ),
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
</script>
<template>
  <form>
    <DataTable
      class="flex-1"
      :class="layout === 'reference' && 'border-0'"
      :columns="['']">
      <DataTableRow>
        <DataTableHeader
          class="relative col-span-full cursor-pointer py-0 px-0 flex items-center"
          :class="layout === 'reference' && 'border-0 min-h-0 mb-1.5'">
          <ScalarComboboxMultiselect
            ref="comboboxRef"
            class="text-xs w-full"
            fullWidth
            :isDeletable="!isReadOnly"
            :modelValue="selectedAuth"
            multiple
            :options="schemeOptions"
            resize
            style="margin-left: 120px"
            :teleport="`#${teleportId}`"
            @delete="handleDeleteScheme"
            @update:modelValue="updateSelectedAuth">
            <ScalarButton
              ref="comboboxButtonRef"
              class="h-auto py-0 px-0 text-c-2 hover:text-c-1 font-normal justify-start -outline-offset-2"
              fullWidth
              variant="ghost">
              <!-- Client only -->
              <template v-if="layout === 'client'">
                <div
                  class="text-c-1 h-8 flex min-w-[94px] items-center pr-0 pl-2">
                  Auth Type
                </div>
                <div
                  v-if="selectedAuth.length"
                  class="flex relative scroll-timeline-x w-full">
                  <div class="fade-left"></div>
                  <div class="flex flex-1 gap-0.25 mr-1.5 items-center">
                    <span
                      v-for="auth in selectedAuth"
                      :key="auth.id"
                      class="cm-pill flex items-center mx-0 h-fit pr-0.5 !bg-b-2 text-c-1">
                      {{ auth.label }}
                      <ScalarIconButton
                        class="cursor-pointer -ml-0.5 text-c-3 hover:text-c-1 rounded-full"
                        icon="Close"
                        :label="`Remove ${auth.label}`"
                        size="xs"
                        @click.stop="unselectAuth(auth.id)"
                        @keydown.enter.stop="unselectAuth(auth.id)" />
                    </span>
                  </div>
                  <div class="fade-right"></div>
                </div>
                <div
                  v-else
                  class="pl-2">
                  None
                </div>
              </template>

              <!-- For references -->
              <div
                v-else
                class="text-c-3 uppercase font-medium">
                Authentication
              </div>

              <ScalarIcon
                class="min-w-3 mr-2.5"
                :class="{
                  'ml-auto': layout === 'client',
                  'ml-1': layout === 'reference',
                }"
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarComboboxMultiselect>
        </DataTableHeader>
      </DataTableRow>
      <RequestExampleAuth
        :layout="layout"
        :selectedSecuritySchemeUids="selectedSecuritySchemeUids" />
    </DataTable>
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
