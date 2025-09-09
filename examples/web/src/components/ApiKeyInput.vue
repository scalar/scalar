<script setup lang="ts">
import { getApiKey, saveApiKey } from '@scalar/api-client'
import { computed, onMounted, ref, watch } from 'vue'

const WORKSPACE_ID = 'default'

/** Reactive API key value */
const apiKey = ref('')

/** Track the previous API key value to detect actual changes */
const previousApiKey = ref('')

/** Track if we've loaded the initial value */
const isInitialized = ref(false)

/** Check if user has any API key (simplified logic) */
const isProUser = computed(() => {
  return !!apiKey.value?.trim()
})

const emit = defineEmits<{
  (e: 'apiKeyChange', key: string | null): void
}>()

/** Load API key from API key manager on mount */
onMounted(() => {
  const stored = getApiKey(WORKSPACE_ID)
  if (stored) {
    apiKey.value = stored.key || ''
    previousApiKey.value = stored.key || ''
  }
  isInitialized.value = true
  
  // Emit initial state
  emit('apiKeyChange', apiKey.value.trim() || null)
})

/** Save API key when it changes */
const handleApiKeyChange = async () => {
  // Don't do anything on initial load
  if (!isInitialized.value) return

  // Check if the value actually changed
  const trimmedKey = apiKey.value.trim()
  const previousTrimmed = previousApiKey.value.trim()

  if (trimmedKey === previousTrimmed) {
    return // No actual change
  }

  const config = {
    key: trimmedKey,
    enabled: true,
    description: 'DefiLlama Pro API Key',
  }

  // Save the API key
  saveApiKey(WORKSPACE_ID, config)

  // Update previous value
  previousApiKey.value = apiKey.value
  
  // Emit the change
  emit('apiKeyChange', trimmedKey || null)
}

/** Debounced API key change handler */
let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(apiKey, (newValue) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  // Only set timer if value actually changed from previous
  if (newValue.trim() !== previousApiKey.value.trim()) {
    debounceTimer = setTimeout(() => {
      handleApiKeyChange()
    }, 1000) // Wait 1 second after user stops typing
  }
})

/** Handle API key input change */
const handleKeyChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  apiKey.value = target.value
}

/** Switch to free API by clearing the API key */
const switchToFreeApi = () => {
  apiKey.value = ''
  handleApiKeyChange()
}
</script>

<template>
  <div class="api-key-input">
    <div class="header">
      <div class="title-section">
        <h3>DefiLlama Pro API Key</h3>
        <div class="header-actions">
          <button
            v-if="isProUser"
            @click="switchToFreeApi"
            class="switch-button">
            Switch to Free API
          </button>
        </div>
      </div>
    </div>

    <div class="input-section">
      <div class="input-wrapper">
        <input
          type="text"
          :value="apiKey"
          placeholder="Enter your DefiLlama Pro API key"
          class="api-key-field"
          @input="handleKeyChange" />
      </div>
      <p class="storage-info">
        Your key is saved locally in your browser's storage.
      </p>
      <p class="description">
        Your API key will be injected into requests to
        <b><code>https://pro-api.llama.fi</code></b> endpoints.
        <br />
        When your API key is set, free endpoints will be changed to pro version to bypass rate limits"
      </p>
    </div>
  </div>
</template>

<style scoped>
.api-key-input {
  background: var(--scalar-background-2, #f8f9fa) !important;
  border: var(--scalar-border-width, 1px) solid
    var(--scalar-border-color, #e1e5e9) !important;
  border-radius: var(--scalar-radius, 6px) !important;
  padding: var(--scalar-spacing-3, 12px) !important;
  font-family: var(--scalar-font, 'Inter', sans-serif) !important;
  box-shadow: var(--scalar-shadow-1, 0 1px 3px rgba(0, 0, 0, 0.1)) !important;
  transition: all 0.15s ease !important;
  flex: 1 !important;
  min-width: 0 !important;
}

.api-key-input:hover {
  border-color: var(--scalar-border-color-hover, #d1d5db) !important;
}

.header {
  margin-bottom: var(--scalar-spacing-2);
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--scalar-spacing-2);
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--scalar-spacing-3);
  flex-wrap: wrap;
}

.header h3 {
  margin: 0 !important;
  font-size: var(--scalar-mini, 13px) !important;
  font-weight: var(--scalar-semibold, 600) !important;
  color: var(--scalar-color-1, #2a2f45) !important;
  line-height: 1.4 !important;
}

.pro-badge {
  display: inline-flex !important;
  align-items: center !important;
  padding: 2px 6px !important;
  background: rgba(255, 165, 0, 0.1) !important;
  color: #ff8c00 !important;
  font-size: var(--scalar-micro, 11px) !important;
  font-weight: var(--scalar-bold, 700) !important;
  border-radius: 4px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.5px !important;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--scalar-spacing-2);
}

.input-wrapper {
  position: relative;
}

.api-key-field {
  width: 100% !important;
  min-width: 0 !important;
  padding: var(--scalar-spacing-2, 8px) !important;
  border: var(--scalar-border-width, 1px) solid
    var(--scalar-border-color, #e1e5e9) !important;
  border-radius: var(--scalar-radius, 6px) !important;
  font-size: var(--scalar-mini, 13px) !important;
  font-family: var(--scalar-font-code, 'Monaco', 'Menlo', monospace) !important;
  background: var(--scalar-background-1, #ffffff) !important;
  color: var(--scalar-color-1, #2a2f45) !important;
  transition: all 0.15s ease !important;
  box-sizing: border-box !important;
}

.api-key-field:focus {
  outline: none !important;
  border-color: var(--scalar-color-accent, #0066cc) !important;
  box-shadow: 0 0 0 1px var(--scalar-color-accent, #0066cc) !important;
  transform: translateY(-1px) !important;
}

.api-key-field:hover:not(:focus) {
  border-color: var(--scalar-border-color-hover);
}

.api-key-field::placeholder {
  color: var(--scalar-color-3);
  opacity: 1;
}

.api-key-field:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.storage-info {
  margin: 0;
  font-size: 10px;
  color: var(--scalar-color-3);
  font-style: italic;
  line-height: 1.3;
  opacity: 0.8;
}

.reload-info {
  display: inline-block;
  color: var(--scalar-color-accent, #0066cc);
  font-weight: var(--scalar-semibold);
  margin-left: 4px;
}

.description {
  margin: 0;
  font-size: var(--scalar-micro);
  color: var(--scalar-color-3);
  line-height: 1.4;
}

.description code {
  background: var(--scalar-background-3);
  padding: 0.1em 0.3em;
  border-radius: var(--scalar-radius-sm);
  font-family: var(--scalar-font-code);
  font-size: 0.9em;
  color: var(--scalar-color-2);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.description small {
  display: block;
  margin-top: var(--scalar-spacing-1);
  opacity: 0.8;
  font-size: 10px;
}

.switch-button {
  padding: var(--scalar-spacing-1-5, 6px) var(--scalar-spacing-2, 8px) !important;
  background: var(--scalar-background-1, #ffffff) !important;
  border: var(--scalar-border-width, 5px) solid
    var(--scalar-border-color-hover, #d1d5db) !important;
  border-radius: var(--scalar-radius, 6px) !important;
  font-size: var(--scalar-micro, 11px) !important;
  font-weight: var(--scalar-semibold, 600) !important;
  color: var(--scalar-color-2, #6b7280) !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  font-family: var(--scalar-font, 'Inter', sans-serif) !important;
  white-space: nowrap !important;
}

.switch-button:hover {
  background: var(--scalar-background-2, #f8f9fa) !important;
  border-color: var(--scalar-border-color-hover, #d1d5db) !important;
  color: var(--scalar-color-1, #2a2f45) !important;
  transform: translateY(-1px) !important;
}

.switch-button:active {
  transform: translateY(0) !important;
  background: var(--scalar-background-3, #e5e7eb) !important;
}

.switch-button:focus {
  outline: none !important;
  border-color: var(--scalar-color-accent, #0066cc) !important;
  box-shadow: 0 0 0 1px var(--scalar-color-accent, #0066cc) !important;
}

.highlight {
  color: var(--scalar-color-accent);
  font-weight: var(--scalar-semibold);
}

/* Responsive Design */
@media (max-width: 640px) {
  .api-key-input {
    padding: var(--scalar-spacing-3);
    margin-bottom: var(--scalar-spacing-4);
  }

  .header h3 {
    font-size: var(--scalar-mini);
  }

  .api-key-field {
    padding: var(--scalar-spacing-2-5);
    font-size: var(--scalar-mini);
  }

  .title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--scalar-spacing-1);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .description {
    font-size: var(--scalar-micro);
  }

  .description small {
    font-size: 10px;
  }

  .switch-button {
    font-size: var(--scalar-micro);
    padding: var(--scalar-spacing-1-5) var(--scalar-spacing-2);
  }
}

@media (max-width: 480px) {
  .api-key-field {
    font-size: 14px;
    padding: 10px;
  }

  .description code {
    word-break: break-all;
    white-space: pre-wrap;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .api-key-input {
    border-width: 2px;
  }

  .api-key-field:focus {
    box-shadow: 0 0 0 2px var(--scalar-color-accent);
  }

  .pro-badge {
    border: 1px solid var(--scalar-color-orange);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .api-key-input,
  .api-key-field,
  .switch-button {
    transition: none;
  }

  .api-key-field:focus,
  .switch-button:hover,
  .switch-button:active {
    transform: none;
  }
}
</style>
