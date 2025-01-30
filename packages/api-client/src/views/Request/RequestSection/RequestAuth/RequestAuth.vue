<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useLayout } from '@/hooks/useLayout'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ADD_AUTH_OPTIONS,
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
} from '@/views/Request/consts'
import { displaySchemeFormatter } from '@/views/Request/libs'
import {
  type Icon,
  ScalarButton,
  type ScalarButton as ScalarButtonType,
  ScalarComboboxMultiselect,
  ScalarIcon,
  useModal,
} from '@scalar/components'
import { isDefined } from '@scalar/oas-utils/helpers'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthDataTable from './RequestAuthDataTable.vue'

const { selectedSecuritySchemeUids, title, layout } = defineProps<{
  selectedSecuritySchemeUids: string[]
  title: string
  layout: 'client' | 'reference'
}>()

const emit = defineEmits<{
  'update:selectedSecuritySchemeUids': [string[]]
}>()

const { layout: clientLayout } = useLayout()
const { activeCollection, activeRequest } = useActiveEntities()
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
  const requirements =
    activeRequest.value?.security ?? activeCollection.value?.security ?? []

  /** Filter out empty objects */
  const filteredRequirements = requirements.filter(
    (r: Record<string, string[]>) => Object.keys(r).length,
  )

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
  emit('update:selectedSecuritySchemeUids', _entries)
}

const editSelectedSchemeUids = (uids: string[]) => {
  if (!activeCollection.value || !activeRequest.value) return

  // Set as selected on the collection for the modal
  if (clientLayout === 'modal' || layout === 'reference') {
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

function handleDeleteScheme(option: { id: string; label: string }) {
  selectedScheme.value = option
  deleteSchemeModal.show()
}

const unselectAuth = (unSelectUid?: string) => {
  const newUids = selectedSecuritySchemeUids.filter(
    (uid) => uid !== unSelectUid,
  )
  editSelectedSchemeUids(newUids)
  emit('update:selectedSecuritySchemeUids', newUids)
  comboboxButtonRef.value?.$el.focus()
  deleteSchemeModal.hide()
}

const availableSchemes = computed(() => {
  const base = activeCollection.value?.securitySchemes
  return (base ?? []).map((s: string) => securitySchemes[s]).filter((s) => s)
})

const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup[]>(
  () => {
    const _availableSchemes = [...availableSchemes.value]
    const requiredSchemes = [] as typeof _availableSchemes

    securityRequirements.value.filteredRequirements.forEach((r) => {
      const i = _availableSchemes.findIndex(
        (s) => s?.nameKey === Object.keys(r)[0],
      )
      if (i > -1) {
        requiredSchemes.push(_availableSchemes[i])
        _availableSchemes.splice(i, 1)
      }
    })

    const availableFormatted = _availableSchemes
      .map((s) => (s ? displaySchemeFormatter(s) : undefined))
      .filter(isDefined)
    const requiredFormatted = requiredSchemes
      .map((s) => (s ? displaySchemeFormatter(s) : undefined))
      .filter(isDefined)

    const options = [
      { label: 'Required authentication', options: requiredFormatted },
      { label: 'Available authentication', options: availableFormatted },
    ]

    if (clientLayout === 'modal' || layout === 'reference')
      return requiredFormatted.length ? options : availableFormatted

    options.push({
      label: 'Add new authentication',
      options: ADD_AUTH_OPTIONS,
    })

    return options
  },
)
</script>
<template>
  <ViewLayoutCollapse
    class="group/params"
    :itemCount="selectedAuth.length"
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
          :modelValue="selectedAuth"
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
                selectedAuth.length === 0
                  ? 'Auth Type'
                  : selectedAuth.length === 1
                    ? selectedAuth[0]?.label
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
      :layout="layout"
      :selectedSecuritySchemeUids="selectedSecuritySchemeUids" />
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
