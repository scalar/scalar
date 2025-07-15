<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

/** API key storage key for localStorage */
const API_KEY_STORAGE_KEY = 'scalar-web-example-api-key'

/** Reactive API key value */
const apiKey = ref('')

/** Whether API key is enabled */
const isEnabled = ref(false)

/** Load API key from localStorage on mount */
onMounted(() => {
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      apiKey.value = parsed.key || ''
      isEnabled.value = parsed.enabled || false
    } catch (error) {
      console.warn('Failed to parse stored API key:', error)
    }
  }
})

/** Save API key to localStorage whenever it changes */
watch(
  [apiKey, isEnabled],
  () => {
    const config = {
      key: apiKey.value.trim(),
      enabled: isEnabled.value,
    }

    if (config.enabled && config.key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(config))
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
  },
  { deep: true },
)

/** Toggle API key enabled state */
const toggleEnabled = () => {
  isEnabled.value = !isEnabled.value
  if (!isEnabled.value) {
    apiKey.value = ''
  }
}

/** Handle API key input change */
const handleKeyChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  apiKey.value = target.value
}
</script>

<template>
  <div class="api-key-input">
    <div class="header">
      <h3>DefiLlama Pro API Key</h3>
      <label class="toggle">
        <input
          type="checkbox"
          :checked="isEnabled"
          @change="toggleEnabled" />
        <span class="slider"></span>
        <span class="label">{{ isEnabled ? 'Enabled' : 'Disabled' }}</span>
      </label>
    </div>

    <div
      v-if="isEnabled"
      class="input-section">
      <input
        type="password"
        :value="apiKey"
        placeholder="Enter your DefiLlama Pro API key"
        class="api-key-field"
        @input="handleKeyChange" />
      <p class="description">
        Your API key will be injected into requests to
        <code>https://pro-api.defillama.com</code> endpoints.
        <br />
        <small>
          <strong>URL Format:</strong> https://pro-api.defillama.com/<span
            class="highlight"
            >your-api-key</span
          >/endpoint
        </small>
      </p>
    </div>
  </div>
</template>

<style scoped>
.api-key-input {
  background: var(--scalar-background-2, #f8f9fa);
  border: 1px solid var(--scalar-border-color, #e1e5e9);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-family: 'Inter', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--scalar-color-1, #2a2f45);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle input {
  position: relative;
  width: 40px;
  height: 20px;
  appearance: none;
  background: var(--scalar-background-3, #e1e5e9);
  border-radius: 20px;
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle input:checked {
  background: var(--scalar-color-accent, #0066cc);
}

.toggle input::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle input:checked::before {
  transform: translateX(20px);
}

.label {
  font-size: 0.8rem;
  color: var(--scalar-color-2, #6b7280);
  font-weight: 500;
}

.input-section {
  margin-top: 1rem;
}

.api-key-field {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--scalar-border-color, #e1e5e9);
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Monaco', 'Menlo', monospace;
  background: var(--scalar-background-1, #ffffff);
  color: var(--scalar-color-1, #2a2f45);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.api-key-field:focus {
  outline: none;
  border-color: var(--scalar-color-accent, #0066cc);
  box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
}

.api-key-field::placeholder {
  color: var(--scalar-color-3, #9ca3af);
}

.description {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--scalar-color-2, #6b7280);
  line-height: 1.4;
}

.description code {
  background: var(--scalar-background-3, #f3f4f6);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.85em;
}

.description small {
  display: block;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.highlight {
  color: var(--scalar-color-accent, #0066cc);
  font-weight: 600;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .api-key-input {
    background: var(--scalar-background-2, #1f2937);
    border-color: var(--scalar-border-color, #374151);
  }

  .api-key-field {
    background: var(--scalar-background-1, #111827);
    border-color: var(--scalar-border-color, #374151);
    color: var(--scalar-color-1, #f9fafb);
  }

  .description code {
    background: var(--scalar-background-3, #374151);
  }
}
</style>
