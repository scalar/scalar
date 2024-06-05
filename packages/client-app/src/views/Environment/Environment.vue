<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutSection from '@/components/ViewLayout/ViewLayoutSection.vue'
import { themeClasses } from '@/constants'
import { useWorkspace } from '@/store/workspace'
import { nanoid } from 'nanoid'
import { ref } from 'vue'

import EnvironmentColors from './EnvironmentColors.vue'

const { environments, environmentMutators } = useWorkspace()

const activeEnvironmentID = ref<string | null>(null)

function addEnvironmentVariable() {
  const environment = {
    name: 'New Environment Variable',
    uid: nanoid(),
    color: 'grey',
    raw: '',
    parsed: [],
  }

  environmentMutators.add(environment)
  activeEnvironmentID.value = environment.uid
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
</script>
<template>
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
  <ViewLayout :class="[themeClasses.view]">
    <ViewLayoutSection>
      <template
        v-if="activeEnvironmentID"
        #title>
        <span>{{ environments[activeEnvironmentID].name }}</span>
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
  </ViewLayout>
</template>
