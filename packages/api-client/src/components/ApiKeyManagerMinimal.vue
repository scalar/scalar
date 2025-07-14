<template>
  <div class="flex flex-col gap-2">
    <div class="grid grid-cols-2 gap-2">
      <!-- Disabled state -->
      <ScalarButton
        :class="
          cx(
            buttonStyles({
              active: !config.enabled,
            }),
          )
        "
        @click="handleDisable">
        <div
          class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
          :class="{
            'bg-c-accent text-b-1 border-transparent': !config.enabled,
          }">
          <ScalarIcon
            v-if="!config.enabled"
            icon="Checkmark"
            size="xs"
            thickness="3.5" />
        </div>
        Disabled
      </ScalarButton>

      <!-- Enabled state -->
      <ScalarButton
        :class="
          cx(
            buttonStyles({
              active: config.enabled,
            }),
          )
        "
        @click="handleEnable">
        <div
          class="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] p-1"
          :class="{
            'bg-c-accent text-b-1 border-transparent': config.enabled,
          }">
          <ScalarIcon
            v-if="config.enabled"
            icon="Checkmark"
            size="xs"
            thickness="3.5" />
        </div>
        Enabled
      </ScalarButton>
    </div>

    <!-- API Key input when enabled -->
    <div
      v-if="config.enabled"
      class="mt-2">
      <input
        v-model="config.key"
        type="password"
        class="border-c-6 bg-b-1 text-c-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder="Enter your Pro API key"
        @input="handleKeyChange"
        @blur="saveConfig" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cva, cx, ScalarButton, ScalarIcon } from '@scalar/components'
import { onMounted, reactive } from 'vue'

import {
  getApiKey,
  removeApiKey,
  saveApiKey,
  type ApiKeyConfig,
} from '@/libs/api-key-manager'
import { useActiveEntities } from '@/store/active-entities'

const { activeWorkspace } = useActiveEntities()

const config = reactive<ApiKeyConfig>({
  key: '',
  enabled: false,
})

const buttonStyles = cva({
  base: 'w-full shadow-none text-c-1 justify-start pl-2 gap-2 border',
  variants: {
    active: {
      true: 'bg-primary text-c-1 hover:bg-inherit',
      false: 'bg-b-1 hover:bg-b-2',
    },
  },
})

/** Load saved API key configuration */
const loadConfig = () => {
  if (activeWorkspace.value?.uid) {
    const saved = getApiKey(activeWorkspace.value.uid)
    if (saved) {
      config.key = saved.key
      config.enabled = saved.enabled
    }
  }
}

/** Save the current configuration */
const saveConfig = () => {
  if (activeWorkspace.value?.uid) {
    if (config.enabled && config.key.trim()) {
      saveApiKey(activeWorkspace.value.uid, {
        key: config.key.trim(),
        enabled: config.enabled,
      })
    } else if (!config.enabled) {
      removeApiKey(activeWorkspace.value.uid)
    }
  }
}

/** Handle enabling API key */
const handleEnable = () => {
  config.enabled = true
  saveConfig()
}

/** Handle disabling API key */
const handleDisable = () => {
  config.enabled = false
  if (activeWorkspace.value?.uid) {
    removeApiKey(activeWorkspace.value.uid)
  }
}

/** Handle key input changes */
const handleKeyChange = () => {
  // Auto-save after a short delay
  setTimeout(saveConfig, 500)
}

onMounted(() => {
  loadConfig()
})
</script>
