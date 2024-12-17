<script setup lang="ts">
import { ref } from 'vue'

import { useCodeMirror } from '../../../src/hooks/useCodeMirror'

const codeMirrorRef = ref<HTMLDivElement | null>(null)

const { codeMirror, setCodeMirrorContent } = useCodeMirror({
  codeMirrorRef,
  content: JSON.stringify(
    {
      foo: 'bar',
    },
    null,
    2,
  ),
  language: 'json',
  lineNumbers: true,
  onChange: (value) => {
    console.log('Content changed:', value)
  },
})
</script>

<template>
  <div class="codemirror-container">
    <div
      ref="codeMirrorRef"
      class="codemirror" />
  </div>
</template>

<style scoped>
.codemirror-container {
  height: 100vh;
  width: 100%;
  padding: 1rem;
}

.codemirror {
  height: 100%;
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
  border-right: 1px solid #404040;
  padding: 0 8px;
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
