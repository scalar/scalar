<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import SubpageHeader from '@/components/SubpageHeader.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { useWorkspace } from '@/store/workspace'
import EnvironmentTable from '@/views/Environment/EnvironmentTable.vue'
import { nanoid } from 'nanoid'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import EnvironmentColors from './EnvironmentColors.vue'

const router = useRouter()
const { environments, environmentMutators } = useWorkspace()

const activeEnvironmentID = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const isEditingName = ref(false)

const addEnvironmentVariable = () => {
  const environment = {
    name: 'New Environment',
    uid: nanoid(),
    color: 'grey',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [{ key: 'exampleKey', value: 'exampleValue' }],
    isDefault: false,
  }

  environmentMutators.add(environment)
  activeEnvironmentID.value = environment.uid
  router.push(activeEnvironmentID.value)
  updateEnvironmentRaw(environment.uid)
}

const handleEnvironmentUpdate = (raw: string) => {
  if (activeEnvironmentID.value) {
    environmentMutators.edit(activeEnvironmentID.value, 'raw', raw)
  }
}

const removeEnvironmentVariable = (uid: string) => {
  environmentMutators.delete(uid)
  if (activeEnvironmentID.value === uid) {
    activeEnvironmentID.value = null
  }
}

const handleColorSelect = (color: string) => {
  if (activeEnvironmentID.value) {
    environments[activeEnvironmentID.value].color = color
  }
}

/** set active environment based on the route */
const setActiveEnvironment = () => {
  const routeEnvironmentId = router.currentRoute.value.params.environment
  if (routeEnvironmentId === 'default') {
    activeEnvironmentID.value = environments.default.uid
  }
}

/** display a focused input to edit environment name */
const enableNameEditing = () => {
  if (
    activeEnvironmentID.value &&
    !environments[activeEnvironmentID.value].isDefault
  ) {
    isEditingName.value = true
    nextTick(() => {
      nameInputRef.value?.focus()
    })
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

const updateEnvironmentRaw = (uid: string) => {
  const environment = environments[uid]
  if (environment) {
    const raw = JSON.stringify(
      environment.parsed.reduce(
        (acc, { key, value }) => {
          if (key || value) {
            /** add raw key-value pairs where either key or value is filled */
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string>,
      ),
      null,
      2,
    )
    environmentMutators.edit(uid, 'raw', raw)
  }
}

const updateEnvironmentVariable = (
  idx: number,
  field: 'key' | 'value',
  value: string,
) => {
  if (activeEnvironmentID.value) {
    const environment = environments[activeEnvironmentID.value]
    const parsed = [...environment.parsed]
    if (parsed.length > idx) {
      parsed[idx] = { ...parsed[idx], [field]: value }
      environmentMutators.edit(activeEnvironmentID.value, 'parsed', parsed)
      updateEnvironmentRaw(activeEnvironmentID.value)
    }
  }
}

const addEnvironmentVariableRow = () => {
  if (activeEnvironmentID.value) {
    const environment = environments[activeEnvironmentID.value]
    const parsed = [...environment.parsed, { key: '', value: '' }]
    environmentMutators.edit(activeEnvironmentID.value, 'parsed', parsed)
    updateEnvironmentRaw(activeEnvironmentID.value)
  }
}

const deleteEnvironmentVariableRow = (idx: number) => {
  if (activeEnvironmentID.value) {
    const environment = environments[activeEnvironmentID.value]
    const parsed = [...environment.parsed]
    parsed.splice(idx, 1)
    environmentMutators.edit(activeEnvironmentID.value, 'parsed', parsed)
    updateEnvironmentRaw(activeEnvironmentID.value)
  }
}

/** parse environment variables from raw JSON: to be managed in environment.ts */
const parsedEnvironmentVariables = computed<{ key: string; value: string }[]>(
  () => {
    if (activeEnvironmentID.value) {
      try {
        const raw = environments[activeEnvironmentID.value].raw
        const parsed = JSON.parse(raw)
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value: value as string,
        }))
      } catch (e) {
        console.error('Failed to parse environment variables:', e)
        return []
      }
    }
    return []
  },
)

onMounted(setActiveEnvironment)
</script>
<template>
  <SubpageHeader>
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
                @delete="removeEnvironmentVariable(environment.uid)" />
            </SidebarList>
          </div>
        </template>
        <template #button>
          <SidebarButton :click="addEnvironmentVariable">
            <template #title>Add Environment Variable</template>
          </SidebarButton>
        </template>
      </Sidebar>
      <ViewLayoutContent class="flex-1">
        <ViewLayoutSection>
          <template
            v-if="activeEnvironmentID"
            #title>
            <span
              v-if="
                !isEditingName || environments[activeEnvironmentID].isDefault
              "
              @dblclick="enableNameEditing">
              {{ environments[activeEnvironmentID].name }}
            </span>
            <input
              v-else
              ref="nameInputRef"
              class="ring-1 ring-offset-4 ring-b-outline rounded"
              spellcheck="false"
              type="text"
              :value="environments[activeEnvironmentID].name"
              @blur="isEditingName = false"
              @input="updateEnvironmentName"
              @keyup.enter="isEditingName = false" />
          </template>
          <EnvironmentTable
            v-if="activeEnvironmentID"
            :items="parsedEnvironmentVariables"
            @addRow="addEnvironmentVariableRow"
            @updateRow="updateEnvironmentVariable" />
        </ViewLayoutSection>
        <ViewLayoutSection>
          <template #title>Editor</template>
          <CodeInput
            v-if="activeEnvironmentID"
            class="px-2 py-2.5"
            :language="'json'"
            lineNumbers
            lint
            :modelValue="environments[activeEnvironmentID].raw"
            @update:modelValue="handleEnvironmentUpdate" />
        </ViewLayoutSection>
      </ViewLayoutContent>
    </ViewLayout>
  </SubpageHeader>
</template>
