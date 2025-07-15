<script setup lang="ts">
import { getApiKey, saveApiKey } from '@scalar/api-client'
import { onMounted, ref, watch } from 'vue'

const WORKSPACE_ID = 'default'

/** Reactive API key value */
const apiKey = ref('')

/** Load API key from API key manager on mount */
onMounted(() => {
  const stored = getApiKey(WORKSPACE_ID)
  if (stored) {
    apiKey.value = stored.key || ''
  }
})

/** Save API key to API key manager whenever it changes */
watch(
  apiKey,
  () => {
    const config = {
      key: apiKey.value.trim(),
      enabled: true, // Always enabled
      description: 'DefiLlama Pro API Key',
    }

    saveApiKey(WORKSPACE_ID, config)
  },
  { deep: true },
)

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
    </div>

    <div class="input-section">
      <input
        type="text"
        :value="apiKey"
        placeholder="Enter your DefiLlama Pro API key"
        class="api-key-field"
        @input="handleKeyChange" />
      <p class="storage-info">
        Your key is saved locally in your browser's storage.
      </p>
      <p class="description">
        Your API key will be injected into requests to
        <code>https://pro-api.llama.fi</code> endpoints.
        <br />
        <small>
          <strong>URL Format:</strong> https://pro-api.llama.fi/<span
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
  margin-bottom: 1rem;
}

.header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--scalar-color-1, #2a2f45);
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

.storage-info {
  margin-top: 0.5rem;
  margin-bottom: 0;
  font-size: 0.75rem;
  color: var(--scalar-color-3, #9ca3af);
  font-style: italic;
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
