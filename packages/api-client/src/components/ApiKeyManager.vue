<template>
  <div class="api-key-manager">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-c-1 text-sm font-medium">Pro API Key</h3>
      <label class="flex cursor-pointer items-center gap-2">
        <input
          v-model="config.enabled"
          type="checkbox"
          class="form-checkbox h-4 w-4 text-blue-600"
          @change="handleToggle" />
        <span class="text-c-2 text-xs">Enable</span>
      </label>
    </div>

    <div
      v-if="config.enabled"
      class="space-y-3">
      <div>
        <label class="text-c-2 mb-1 block text-xs font-medium"> API Key </label>
        <input
          v-model="config.key"
          type="password"
          class="border-c-6 bg-c-1 text-c-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter your Pro API key"
          @input="handleKeyChange"
          @blur="saveConfig" />
      </div>

      <div v-if="config.description !== undefined">
        <label class="text-c-2 mb-1 block text-xs font-medium">
          Description (Optional)
        </label>
        <input
          v-model="config.description"
          type="text"
          class="border-c-6 bg-c-1 text-c-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g., DefiLlama Pro API"
          @blur="saveConfig" />
      </div>

      <div class="bg-c-2 rounded-md p-3">
        <p class="text-c-2 mb-2 text-xs">
          <strong>URL Format:</strong> The API key will be injected as a path
          segment
        </p>
        <div class="text-c-3 bg-c-1 rounded border p-2 font-mono text-xs">
          <span class="text-c-2">Base URL:</span>
          https://pro-api.defillama.com<br />
          <span class="text-c-2">API Key:</span>
          {{ config.key || 'your-api-key' }}<br />
          <span class="text-c-2">Endpoint:</span> /coins/latest<br />
          <span class="text-c-2">Final URL:</span>
          <span class="text-blue-600">
            https://pro-api.defillama.com/{{
              config.key || 'your-api-key'
            }}/coins/latest
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  description: '',
})

/** Load saved API key configuration */
const loadConfig = () => {
  if (activeWorkspace.value?.uid) {
    const saved = getApiKey(activeWorkspace.value.uid)
    if (saved) {
      config.key = saved.key
      config.enabled = saved.enabled
      config.description = saved.description || ''
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
        description: config.description?.trim() || undefined,
      })
    } else if (!config.enabled) {
      removeApiKey(activeWorkspace.value.uid)
    }
  }
}

/** Handle toggle change */
const handleToggle = () => {
  if (!config.enabled) {
    // When disabling, clear the configuration
    if (activeWorkspace.value?.uid) {
      removeApiKey(activeWorkspace.value.uid)
    }
  } else {
    // When enabling, save if we have a key
    saveConfig()
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

<style scoped></style>
