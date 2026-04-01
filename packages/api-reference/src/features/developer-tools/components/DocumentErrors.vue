<script lang="ts" setup>
import type { DocumentError } from '@scalar/workspace-store/client'
import { computed, ref } from 'vue'

const { errors } = defineProps<{
  errors: Record<string, DocumentError[]>
}>()

const dismissed = ref(false)

const allErrors = computed(() => Object.entries(errors))

const errorCount = computed(() =>
  allErrors.value.reduce((sum, [, errs]) => sum + errs.length, 0),
)

const hasErrors = computed(() => errorCount.value > 0 && !dismissed.value)
</script>
<template>
  <Teleport to="body">
    <div
      v-if="hasErrors"
      class="document-error-overlay">
      <div class="document-error-container custom-scroll">
        <div class="document-error-header">
          <div class="document-error-title">
            <span class="document-error-icon">&#x26A0;</span>
            {{ errorCount }} document
            {{ errorCount === 1 ? 'error' : 'errors' }}
          </div>
          <button
            class="document-error-dismiss"
            type="button"
            @click="dismissed = true">
            &#x2715;
          </button>
        </div>
        <div class="document-error-body">
          <div
            v-for="[docName, docErrors] in allErrors"
            :key="docName"
            class="document-error-group">
            <h4 class="document-error-group-title">{{ docName }}</h4>
            <ul class="document-error-list">
              <li
                v-for="(error, index) in docErrors"
                :key="index"
                class="document-error-item">
                <span
                  class="document-error-badge"
                  :data-type="error.type">
                  {{ error.type }}
                </span>
                <div class="document-error-detail">
                  <p class="document-error-message">{{ error.message }}</p>
                  <code
                    v-if="error.path"
                    class="document-error-path">
                    #{{ error.path }}
                  </code>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
<style scoped>
.document-error-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--scalar-background-1) 80%, transparent);
  font-family: var(--scalar-font);
}

.document-error-container {
  background: var(--scalar-background-2);
  color: var(--scalar-color-1);
  border-radius: var(--scalar-radius-lg);
  width: min(90vw, 800px);
  max-height: 80vh;
  overflow-y: auto;
}

.document-error-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--scalar-border-color);
  position: sticky;
  top: 0;
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
}

.document-error-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--scalar-heading-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-red);
}

.document-error-icon {
  font-size: var(--scalar-heading-3);
}

.document-error-dismiss {
  background: none;
  border: none;
  color: var(--scalar-color-2);
  font-size: var(--scalar-small);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--scalar-radius);
  line-height: 1;
}

.document-error-dismiss:hover {
  color: var(--scalar-color-1);
  background: var(--scalar-background-3);
}

.document-error-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.document-error-group-title {
  color: var(--scalar-color-3);
  margin: 0 0 8px;
  font-weight: var(--scalar-regular);
}

.document-error-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.document-error-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: var(--scalar-background-3);
  border-radius: var(--scalar-radius-lg);
  border-left: 3px solid var(--scalar-border-color);
}

.document-error-item:has([data-type='fetch']) {
  border-left-color: var(--scalar-color-red);
}

.document-error-item:has([data-type='validation']) {
  border-left-color: var(--scalar-color-yellow);
}

.document-error-badge {
  flex-shrink: 0;
  font-size: var(--scalar-micro);
  padding: 2px 5px;
  border-radius: var(--scalar-radius);
  text-transform: uppercase;
  margin-top: 1px;
}

.document-error-badge[data-type='fetch'] {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
  color: var(--scalar-color-red);
}

.document-error-badge[data-type='validation'] {
  background: color-mix(in srgb, var(--scalar-color-yellow), transparent 90%);
  color: var(--scalar-color-yellow);
}

.document-error-detail {
  min-width: 0;
  flex: 1;
}

.document-error-message {
  margin: 0;
  font-size: var(--scalar-small);
  line-height: 1.5;
  word-break: break-word;
  color: var(--scalar-color-1);
}

.document-error-path {
  display: block;
  margin-top: 6px;
  font-size: var(--scalar-small);
  color: var(--scalar-color-2);
  font-family: var(--scalar-font-code);
}
</style>
