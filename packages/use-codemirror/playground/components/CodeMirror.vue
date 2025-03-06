<script setup lang="ts">
import { ref } from 'vue'

import { useCodeMirror } from '@/hooks/useCodeMirror'

const codeMirrorRef = ref<HTMLDivElement | null>(null)

const lineNumbers = ref<boolean>(true)
const readOnly = ref<boolean>(false)
const lint = ref<boolean>(true)
const disableTabIndent = ref<boolean>(false)
const forceFoldGutter = ref<boolean>(false)

useCodeMirror({
  codeMirrorRef,
  content: JSON.stringify(
    {
      users: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            street: '123 Main St',
            city: 'Boston',
            state: 'MA',
            zip: '02108',
          },
          orders: [
            {
              orderId: 'ORD-001',
              items: [
                {
                  productId: 'P100',
                  name: 'Widget',
                  quantity: 2,
                  price: 29.99,
                },
                {
                  productId: 'P200',
                  name: 'Gadget',
                  quantity: 1,
                  price: 49.99,
                },
              ],
              total: 109.97,
            },
          ],
        },
      ],
      metadata: {
        version: '1.0',
        generated: '2023-12-25T12:00:00Z',
        settings: {
          currency: 'USD',
          timezone: 'America/New_York',
        },
      },
    },
    null,
    2,
  ),
  language: 'json',
  lineNumbers,
  readOnly,
  lint,
  disableTabIndent,
  forceFoldGutter,
  onChange: (value) => {
    console.log('Content changed:', value)
  },
})
</script>

<template>
  <div class="codemirror-container">
    <div class="codemirror-menu">
      <button
        :class="{ 'is-active': lineNumbers }"
        type="button"
        @click="lineNumbers = !lineNumbers">
        lineNumbers
      </button>
      <button
        :class="{ 'is-active': readOnly }"
        type="button"
        @click="readOnly = !readOnly">
        readOnly
      </button>
      <button
        :class="{ 'is-active': lint }"
        type="button"
        @click="lint = !lint">
        lint
      </button>
      <button
        :class="{ 'is-active': disableTabIndent }"
        type="button"
        @click="disableTabIndent = !disableTabIndent">
        disableTabIndent
      </button>
      <button
        :class="{ 'is-active': forceFoldGutter }"
        type="button"
        @click="forceFoldGutter = !forceFoldGutter">
        forceFoldGutter
      </button>
    </div>
    <div
      ref="codeMirrorRef"
      class="codemirror" />
  </div>
</template>

<style scoped>
.codemirror-menu {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: var(--scalar-small);
}

button {
  padding: 0.5rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: #f0f0f0;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  cursor: pointer;
}

button.is-active {
  background: #007bff;
  color: #fff;
}

.codemirror-container {
  height: 100vh;
  width: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.codemirror {
  flex-grow: 1;
  width: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: auto;
}

/* CodeMirror specific styles */
:deep(.cm-editor) {
  height: 100%;
}

:deep(.cm-scroller) {
  padding: 4px 0;
}

:deep(.cm-gutters) {
  background: #1e1e1e;
  padding: 0 8px;
  color: #858585;
  font-size: 12px;
}

:deep(.cm-lineNumbers) {
  color: #858585;
}

:deep(.cm-content) {
  padding: 0 8px;
}

:deep(.cm-line) {
  padding: 0 4px;
}

:deep(.cm-activeLine) {
  background: rgba(255, 255, 255, 0.05);
}

:deep(.cm-cursor) {
  border-left: 2px solid #fff;
}
</style>
