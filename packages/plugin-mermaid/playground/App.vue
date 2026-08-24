<script setup lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { ref } from 'vue'

import MermaidDiagram from '../src/MermaidDiagram.vue'

/**
 * A few ready-made diagrams so the playground shows off more than one Mermaid diagram type. The
 * value is bound to `<MermaidDiagram :x-mermaid>` exactly the way the API Reference binds the raw
 * `x-mermaid` specification extension, so what renders here matches what a real document renders.
 */
const examples = {
  Sequence: `sequenceDiagram
  Client->>API: POST /orders
  API->>Client: 201 Created`,
  Flowchart: `flowchart TD
  A[Request] --> B{Authenticated?}
  B -- Yes --> C[200 OK]
  B -- No --> D[401 Unauthorized]`,
  State: `stateDiagram-v2
  [*] --> Draft
  Draft --> Published
  Published --> [*]`,
  Broken: 'this is not a valid mermaid diagram',
} satisfies Record<string, string>

const source = ref(examples.Sequence)

const { isDarkMode, toggleColorMode } = useColorMode()
</script>

<template>
  <main class="playground">
    <header class="toolbar">
      <h1>@scalar/plugin-mermaid</h1>
      <button
        type="button"
        @click="toggleColorMode">
        {{ isDarkMode ? 'Switch to light mode' : 'Switch to dark mode' }}
      </button>
    </header>

    <div class="examples">
      <button
        v-for="(value, label) in examples"
        :key="label"
        type="button"
        @click="source = value">
        {{ label }}
      </button>
    </div>

    <div class="columns">
      <textarea
        v-model="source"
        class="editor"
        spellcheck="false" />
      <div class="preview">
        <MermaidDiagram :x-mermaid="source" />
      </div>
    </div>
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #ffffff;
  color: #1a1a1a;
}
body.dark-mode {
  background: #0d0f11;
  color: #f2f2f2;
}
.playground {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
button {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
}
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.editor {
  min-height: 220px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.4);
  background: transparent;
  color: inherit;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
  resize: vertical;
}
.preview {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(128, 128, 128, 0.4);
}
</style>
