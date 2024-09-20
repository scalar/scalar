<script setup lang="ts">
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/components/DataTable'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store'
import {
  ADD_AUTH_OPTIONS,
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
} from '@/views/Request/consts'
import {
  createSchemeValueSet,
  displaySchemeFormatter,
} from '@/views/Request/libs'
import {
  ScalarButton,
  ScalarComboboxMultiselect,
  ScalarIcon,
  useModal,
} from '@scalar/components'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestExampleAuth from './RequestExampleAuth.vue'

defineProps<{
  title: string
}>()

const {
  activeCollection,
  activeRequest,
  collectionMutators,
  isReadOnly,
  requestMutators,
  securitySchemes,
  securitySchemeMutators,
} = useWorkspace()

const comboboxRef = ref<typeof ScalarComboboxMultiselect | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | undefined>(undefined)

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
  /** With optional ({}) filtered out */
  const requestSecurity = activeRequest.value?.security?.filter(
    (s) => Object.keys(s).length,
  )

  const base =
    isReadOnly.value && requestSecurity?.length
      ? requestSecurity.map((s) => {
          const nameKey = Object.keys(s)[0]
          return (
            Object.values(securitySchemes).find((ss) => ss.nameKey === nameKey)
              ?.uid ?? ''
          )
        })
      : activeCollection.value?.securitySchemes

  return (base ?? []).map((s) => securitySchemes[s]).filter((s) => s)
})

/** Display formatted options for a user to select from */
const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup[]>(
  () => {
    const availableFormatted = availableSchemes.value.map((s) =>
      displaySchemeFormatter(s),
    )

    // Read only mode we don't want to add new auth
    if (isReadOnly.value) return availableFormatted

    return [
      { label: 'Select auth', options: availableFormatted },
      {
        label: 'Add new auth',
        options: ADD_AUTH_OPTIONS,
      },
    ]
  },
)

/** Currently selected auth schemes on the collection */
const selectedAuth = computed(
  () =>
    activeRequest.value?.selectedSecuritySchemeUids.map((uid) =>
      displaySchemeFormatter(securitySchemes[uid]),
    ) ?? [],
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

    _entries.push(scheme.uid)
  }

  // Here we grab the keys for auth that doesn't yet exist
  const newAuth = _entries.filter((uid) => !activeCollection.value!.auth[uid])

  // Create new auth entries for new auth
  collectionMutators.edit(
    activeCollection.value.uid,
    'auth',
    newAuth.reduce((prev, uid) => {
      prev[uid] = createSchemeValueSet(securitySchemes[uid])
      return prev
    }, activeCollection.value.auth),
  )

  // Set as selected on request
  requestMutators.edit(
    activeRequest.value.uid,
    'selectedSecuritySchemeUids',
    _entries,
  )
}

/** Remove a single auth type from an example */
const unselectAuth = (unSelectUid: string) =>
  activeRequest.value &&
  requestMutators.edit(
    activeRequest.value.uid,
    'selectedSecuritySchemeUids',
    activeRequest.value.selectedSecuritySchemeUids.filter(
      (uid) => uid !== unSelectUid,
    ),
  )

function handleDeleteScheme(option: { id: string; label: string }) {
  selectedScheme.value = option
  deleteSchemeModal.show()
}
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="selectedAuth.length">
    <template #title>
      <div class="flex gap-1">
        {{ title }}
      </div>
    </template>
    <form>
      <DataTable
        class="flex-1"
        :columns="['']">
        <DataTableRow>
          <DataTableHeader
            class="relative col-span-full cursor-pointer py-[0px] px-[0px] flex items-center">
            <ScalarComboboxMultiselect
              ref="comboboxRef"
              class="text-xs w-full"
              fullWidth
              isDeletable
              :modelValue="selectedAuth"
              multiple
              :options="schemeOptions"
              style="margin-left: 120px"
              teleport
              @delete="handleDeleteScheme"
              @update:modelValue="updateSelectedAuth">
              <ScalarButton
                class="h-auto py-0 px-0 text-c-2 hover:text-c-1 font-normal justify-start"
                fullWidth
                variant="ghost">
                <div
                  class="text-c-2 h-8 flex min-w-[120px] items-center border-r-1/2 pr-0 pl-2">
                  Auth Type
                </div>
                <div
                  v-if="selectedAuth.length"
                  class="flex relative scroll-timeline-x w-full">
                  <div class="fade-left"></div>
                  <div class="flex flex-1 gap-0.75 mr-1.5 items-center">
                    <span
                      v-for="auth in selectedAuth"
                      :key="auth.id"
                      class="cm-pill flex items-center mx-0 h-fit">
                      {{ auth.label }}
                      <ScalarIcon
                        class="ml-1 cursor-pointer text-c-3 hover:text-c-1"
                        icon="Close"
                        size="xs"
                        @click.stop="unselectAuth(auth.id)" />
                    </span>
                  </div>
                  <div class="fade-right"></div>
                </div>
                <div
                  v-else
                  class="pl-2">
                  None
                </div>
                <ScalarIcon
                  class="min-w-3 ml-auto mr-2.5"
                  icon="ChevronDown"
                  size="xs" />
              </ScalarButton>
            </ScalarComboboxMultiselect>
          </DataTableHeader>
        </DataTableRow>
        <RequestExampleAuth />
      </DataTable>
      <DeleteRequestAuthModal
        :scheme="selectedScheme"
        :state="deleteSchemeModal"
        @close="deleteSchemeModal.hide()" />
    </form>
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
  z-index: 1;
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
