<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { nanoid } from 'nanoid'
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import EnvironmentColors from './EnvironmentColors.vue'

const router = useRouter()
const { environments, environmentMutators } = useWorkspace()

const activeEnvironmentID = ref<string | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const isEditingName = ref(false)

function addEnvironmentVariable() {
  const environment = {
    name: 'New Environment',
    uid: nanoid(),
    color: 'grey',
    raw: JSON.stringify({ exampleKey: 'exampleValue' }, null, 2),
    parsed: [],
    isDefault: false,
  }

  environmentMutators.add(environment)
  activeEnvironmentID.value = environment.uid
  router.push(activeEnvironmentID.value)
}

function handleEnvironmentUpdate(raw: string) {
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
    environments[activeEnvironmentID.value].name = newName
  }
}

onMounted(setActiveEnvironment)
</script>
<template>
  <ViewLayout>
    <Sidebar>
      <template #title>Environment</template>
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
    <ViewLayoutContent :class="[themeClasses.view]">
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
          class="px-2 py-2.5"
          lineNumbers
          :modelValue="environments[activeEnvironmentID].raw"
          @update:modelValue="handleEnvironmentUpdate" />
      </ViewLayoutSection>
    </ViewLayoutContent>
  </ViewLayout>
</template>
