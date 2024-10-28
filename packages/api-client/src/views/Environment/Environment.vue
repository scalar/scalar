<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import type { HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { environmentSchema } from '@scalar/oas-utils/entities/environment'
import { nanoid } from 'nanoid'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EnvironmentColors from './EnvironmentColors.vue'

defineProps<{
  isApp: boolean
}>()
const router = useRouter()
const route = useRoute()
const { environments, environmentMutators, events } = useWorkspace()

const activeEnvironmentID = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const isEditingName = ref(false)

function addEnvironment() {
  const environment = environmentSchema.parse({
    name: 'New Environment',
    uid: nanoid(),
    color: 'grey',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [],
    isDefault: false,
  })

  environmentMutators.add(environment)
  activeEnvironmentID.value = environment.uid
  router.push(activeEnvironmentID.value)
}

function handleEnvironmentUpdate(raw: string) {
  if (activeEnvironmentID.value) {
    environmentMutators.edit(activeEnvironmentID.value, 'value', raw)
  }
}

const removeEnvironment = (uid: string) => {
  environmentMutators.delete(uid)
  if (activeEnvironmentID.value === uid) {
    activeEnvironmentID.value = null
  }
}

const handleColorSelect = (color: string) =>
  activeEnvironmentID.value &&
  environmentMutators.edit(activeEnvironmentID.value, 'color', color)

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

const handleHotKey = (event?: HotKeyEvent) => {
  if (event?.createNew && route.name === 'environment') {
    addEnvironment()
  }
}

onMounted(() => {
  setActiveEnvironment()
  events.hotKeys.on(handleHotKey)
})
onBeforeUnmount(() => events.hotKeys.off(handleHotKey))
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
              @delete="removeEnvironment(environment.uid)" />
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton
          :click="addEnvironment"
          hotkey="N"
          :isApp="isApp">
          <template #title>Add Environment</template>
        </SidebarButton>
      </template>
    </Sidebar>
    <ViewLayoutContent class="flex-1">
      <ViewLayoutSection>
        <template
          v-if="activeEnvironmentID"
          #title>
          <span
            v-if="!isEditingName || environments[activeEnvironmentID].isDefault"
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
          <div class="colors ml-auto">
            <EnvironmentColors
              :activeColor="environments[activeEnvironmentID].color"
              @select="handleColorSelect" />
          </div>
        </template>
        <CodeInput
          v-if="activeEnvironmentID"
          class="pl-px pr-2 md:px-2 py-2.5"
          language="json"
          lineNumbers
          :modelValue="environments[activeEnvironmentID].value"
          @update:modelValue="handleEnvironmentUpdate" />
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
