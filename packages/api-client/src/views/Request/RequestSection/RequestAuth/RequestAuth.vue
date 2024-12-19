<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
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
  type ScalarComboboxMultiselect as ScalarComboboxMultiselectType,
  ScalarIcon,
  useModal,
} from '@scalar/components'
import { type SecurityScheme } from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'

import DeleteRequestAuthModal from './DeleteRequestAuthModal.vue'
import RequestAuthDataTable from './RequestAuthDataTable.vue'

const { selectedSecuritySchemeUids } = defineProps<{
  selectedSecuritySchemeUids: string[]
  title: string
}>()

const emit = defineEmits<{
  'update:selectedSecuritySchemeUids': [string[]]
}>()
const { activeCollection, activeRequest } = useActiveEntities()
const {
  isReadOnly,
  securitySchemes,
  securitySchemeMutators,
  requestMutators,
  collectionMutators,
} = useWorkspace()

const comboboxRef = ref<typeof ScalarComboboxMultiselectType | null>(null)
const comboboxButtonRef = ref<typeof ScalarButtonType | null>(null)
const deleteSchemeModal = useModal()
const selectedScheme = ref<{ id: string; label: string } | undefined>(undefined)

/** Security requirements for the request */
const securityRequirements = computed(() => {
  const requirements =
    activeRequest.value?.security ?? activeCollection.value?.security ?? []

  /** Filter out empty objects */
  const filteredRequirements = requirements.filter(
    (r: SecurityScheme) => Object.keys(r).length,
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
      ? Object.keys(filteredRequirements[0])[0]
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

/** A local div to teleport the combobox to */
const teleportId = `combobox-${nanoid()}`

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
  return (base ?? [])
    .map((s: string) => securitySchemes[s])
    .filter((s: SecurityScheme) => s)
})

const schemeOptions = computed<SecuritySchemeOption[] | SecuritySchemeGroup[]>(
  () => {
    const _availableSchemes = [...availableSchemes.value]
    const requiredSchemes = [] as typeof _availableSchemes

    securityRequirements.value.filteredRequirements.forEach(
      (r: SecurityScheme) => {
        const i = _availableSchemes.findIndex(
          (s) => s.nameKey === Object.keys(r)[0],
        )
        if (i > -1) {
          requiredSchemes.push(_availableSchemes[i])
          _availableSchemes.splice(i, 1)
        }
      },
    )

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

    if (isReadOnly)
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
    :itemCount="selectedAuth.length">
    <template #title>
      <div class="flex flex-1 gap-1 items-center justify-between">
        {{ title }}

        <!-- Authentication indicator -->
        <div
          v-if="authIndicator"
          class="flex items-center gap-1 text-c-1">
          {{ authIndicator.text }}
        </div>
        <!-- Move combobox back inside title but wrap in div that stops propagation -->
        <div
          class="ml-auto hover:bg-b-3 rounded pl-2"
          @click.stop>
          <ScalarComboboxMultiselect
            ref="comboboxRef"
            class="text-xs !w-[300px]"
            :isDeletable="!isReadOnly"
            :modelValue="selectedAuth"
            multiple
            :options="schemeOptions"
            resize
            :teleport="`#${teleportId}`"
            @delete="handleDeleteScheme"
            @update:modelValue="updateSelectedAuth">
            <ScalarButton
              ref="comboboxButtonRef"
              class="h-auto py-0 px-0 text-c-1 hover:text-c-1 font-normal justify-start -outline-offset-2"
              fullWidth
              variant="ghost">
              <div class="text-c-1">
                {{
                  selectedAuth.length === 0
                    ? 'Auth Type'
                    : selectedAuth.length === 1
                      ? selectedAuth[0].label
                      : 'Multiple'
                }}
              </div>
              <ScalarIcon
                class="min-w-3 mr-1.5 ml-2"
                icon="ChevronDown"
                size="xs" />
            </ScalarButton>
          </ScalarComboboxMultiselect>
          <div :id="teleportId" />
        </div>
      </div>
    </template>
    <RequestAuthDataTable
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
