<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarIcon,
  ScalarTooltip,
  useModal,
} from '@scalar/components'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { nanoid } from 'nanoid'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import EnvironmentColorModal from './EnvironmentColorModal.vue'
import EnvironmentModal from './EnvironmentModal.vue'
import EnvironmentTable from './EnvironmentTable.vue'

const router = useRouter()
const { environments, environmentMutators } = useWorkspace()
const colorModal = useModal()
const environmentModal = useModal()

const activeEnvironmentID = ref<string | null>(null)
const showTable = ref(false)
const colorModalEnvironment = ref<string | null>(null)
const selectedColor = ref('')

function addEnvironment(environment: { name: string; color: string }) {
  const newEnvironment = environmentSchema.parse({
    name: environment.name,
    uid: nanoid(),
    color: environment.color,
    value: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    isDefault: false,
  })

  environmentMutators.add(newEnvironment)
  activeEnvironmentID.value = newEnvironment.uid
  router.push(activeEnvironmentID.value)
  environmentModal.hide()
}

function handleEnvironmentUpdate(raw: string) {
  if (activeEnvironmentID.value) {
    const newParams = parseEnvironmentValue(raw)

    // Filter out entries where both key and value are empty
    const filteredParams = newParams.filter(
      ({ key, value }) => key !== '' || value !== '',
    )

    if (filteredParams.length > 0) {
      const updatedParams = Object.fromEntries(
        filteredParams.map(({ key, value }) => [key, value]),
      )

      // Update the environment with the new parameters
      environmentMutators.edit(
        activeEnvironmentID.value,
        'value',
        JSON.stringify(updatedParams, null, 2),
      )

      // Ensure the table is updated by triggering a reactivity update
      environments[activeEnvironmentID.value].value = JSON.stringify(
        updatedParams,
        null,
        2,
      )
    }
  }
}

const removeEnvironment = (uid: string) => {
  environmentMutators.delete(uid)
  if (activeEnvironmentID.value === uid) {
    activeEnvironmentID.value = null
  }
}

const handleOpenColorModal = (uid: string) => {
  colorModalEnvironment.value = uid
  selectedColor.value = environments[uid].color || ''
  colorModal.show()
}

const submitColorChange = (color: string) => {
  if (colorModalEnvironment.value) {
    environmentMutators.edit(colorModalEnvironment.value, 'color', color)
    colorModal.hide()
  }
}

/** set active environment based on the route */
const setActiveEnvironment = () => {
  const routeEnvironmentId = router.currentRoute.value.params.environment
  if (routeEnvironmentId === 'default') {
    activeEnvironmentID.value = environments.default.uid
  }
}

const updateEnvironmentName = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newName = target.value
  if (
    activeEnvironmentID.value &&
    !environments[activeEnvironmentID.value].isDefault
  ) {
    environmentMutators.edit(activeEnvironmentID.value, 'name', newName)
  }
}

function parseEnvironmentValue(valueStr: string, excludeEmptyLastRow = false) {
  if (!valueStr || typeof valueStr !== 'string') {
    console.error('Invalid input: not a valid JSON string')
    return []
  }

  try {
    const parsedObject = JSON.parse(valueStr)
    const entries = Object.entries(parsedObject).map(([key, val]) => ({
      key,
      value: String(val),
    }))

    // Exclude the last empty row if specified
    if (excludeEmptyLastRow && entries.length > 0) {
      const lastEntry = entries[entries.length - 1]
      if (lastEntry.key === '' && lastEntry.value === '') {
        entries.pop()
      }
    }

    return entries
  } catch (_) {
    return []
  }
}

const addEnvironmentRow = () => {
  if (!activeEnvironmentID.value) return

  const newParam = { key: '', value: '', enabled: false }
  const currentParams = parseEnvironmentValue(
    environments[activeEnvironmentID.value].value,
  )
  const newParams = [...currentParams, newParam]

  environmentMutators.edit(
    activeEnvironmentID.value,
    'value',
    JSON.stringify(
      Object.fromEntries(newParams.map(({ key, value }) => [key, value])),
      null,
      2,
    ),
  )
}

function updateEnvironmentRow(
  rowIdx: number,
  field: 'key' | 'value',
  newValue: string,
) {
  if (!activeEnvironmentID.value) return

  const currentParams = parseEnvironmentValue(
    environments[activeEnvironmentID.value].value,
  )
  if (currentParams.length > rowIdx) {
    const updatedParams = [...currentParams]
    updatedParams[rowIdx] = { ...updatedParams[rowIdx], [field]: newValue }

    // Remove the row if both key and value are empty, unless it's the first row
    if (
      updatedParams[rowIdx].key === '' &&
      updatedParams[rowIdx].value === '' &&
      rowIdx !== 0
    ) {
      updatedParams.splice(rowIdx, 1)
    }

    environmentMutators.edit(
      activeEnvironmentID.value,
      'value',
      JSON.stringify(
        Object.fromEntries(updatedParams.map(({ key, value }) => [key, value])),
        null,
        2,
      ),
    )
  } else {
    const payload = [{ key: '', value: '', enabled: false }]
    payload[0][field] = newValue
    environmentMutators.edit(
      activeEnvironmentID.value,
      'value',
      JSON.stringify(
        Object.fromEntries(payload.map(({ key, value }) => [key, value])),
        null,
        2,
      ),
    )
  }
}

function defaultRow() {
  if (!activeEnvironmentID.value) return

  const currentParams = parseEnvironmentValue(
    environments[activeEnvironmentID.value].value,
    true,
  )

  // Check if the last row is empty, if not, add an empty row
  if (
    currentParams.length === 0 ||
    currentParams[currentParams.length - 1].key !== '' ||
    currentParams[currentParams.length - 1].value !== ''
  ) {
    addEnvironmentRow()
  }
}

const openEnvironmentModal = () => {
  environmentModal.show()
}

onMounted(() => {
  setActiveEnvironment()
  defaultRow()
})

watch(
  () =>
    activeEnvironmentID.value !== null
      ? environments[activeEnvironmentID.value].value
      : null,
  () => {
    defaultRow()
  },
  { immediate: true },
)
</script>
<template>
  <ViewLayout>
    <Sidebar title="Environment">
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              v-for="environment in environments"
              :key="environment.uid"
              class="text-xs"
              :variable="{
                name: environment.name,
                uid: environment.uid,
                color: environment.color,
                isDefault: environment.isDefault,
              }"
              :warningMessage="`Are you sure you want to delete this environment?`"
              @click="activeEnvironmentID = environment.uid"
              @colorModal="handleOpenColorModal"
              @delete="removeEnvironment(environment.uid)" />
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="openEnvironmentModal">
          <template #title>Add Environment</template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template
          v-if="activeEnvironmentID"
          #title>
          <div class="flex-1 flex gap-1 items-center relative">
            <label
              v-if="!environments[activeEnvironmentID].isDefault"
              class="absolute w-full h-full top-0 left-0 pointer-events-auto opacity-0 cursor-text"
              for="environmentname"></label>
            <input
              v-if="!environments[activeEnvironmentID].isDefault"
              id="environmentname"
              class="outline-none border-0 text-c-1 rounded pointer-events-auto relative w-full"
              placeholder="Environment Name"
              :value="environments[activeEnvironmentID].name"
              @input="updateEnvironmentName" />
            <span
              v-else
              class="text-c-1">
              {{ environments[activeEnvironmentID].name }}
            </span>
          </div>
          <div class="ml-auto">
            <ScalarTooltip
              align="center"
              class="scalar-client"
              side="left"
              :sideOffset="6">
              <template #trigger>
                <ScalarButton
                  v-show="showTable"
                  class="h-7 w-7 p-0.5 hover:bg-b-2"
                  variant="ghost"
                  @click="showTable = !showTable">
                  <ScalarIcon
                    icon="Terminal"
                    size="lg"
                    thickness="1.5" />
                </ScalarButton>
              </template>
              <template #content>
                <span class="bg-b-1 border px-2 py-1 rounded text-xs"
                  >Switch to Code View</span
                >
              </template>
            </ScalarTooltip>
            <ScalarTooltip
              align="center"
              class="scalar-client"
              side="left"
              :sideOffset="6">
              <template #trigger>
                <ScalarButton
                  v-show="!showTable"
                  class="h-7 w-7 p-0.5 hover:bg-b-2"
                  variant="ghost"
                  @click="showTable = !showTable">
                  <ScalarIcon
                    icon="Table"
                    size="lg"
                    thickness="1.5" />
                </ScalarButton>
              </template>
              <template #content>
                <span class="bg-b-1 border px-2 py-1 rounded text-xs"
                  >Switch to Table View</span
                >
              </template>
            </ScalarTooltip>
          </div>
        </template>
        <CodeInput
          v-if="activeEnvironmentID && !showTable"
          class="pl-px pr-2 md:px-2 py-2.5"
          language="json"
          lineNumbers
          :modelValue="
            JSON.stringify(
              Object.fromEntries(
                parseEnvironmentValue(
                  environments[activeEnvironmentID].value,
                  true,
                ).map(({ key, value }) => [key, value]),
              ),
              null,
              2,
            )
          "
          @update:modelValue="handleEnvironmentUpdate" />
        <EnvironmentTable
          v-else-if="activeEnvironmentID"
          :items="
            parseEnvironmentValue(environments[activeEnvironmentID].value)
          "
          @addRow="addEnvironmentRow"
          @updateRow="updateEnvironmentRow" />
      </ViewLayoutSection>
    </ViewLayoutContent>
    <EnvironmentColorModal
      :selectedColor="selectedColor"
      :state="colorModal"
      @cancel="colorModal.hide()"
      @submit="submitColorChange" />
    <EnvironmentModal
      :state="environmentModal"
      @cancel="environmentModal.hide()"
      @submit="addEnvironment" />
  </ViewLayout>
</template>
