<script setup lang="ts">
import '@scalar/themes/style.css'
import '@scalar/components/style.css'
import '../../../dist/style.css'

import { ScalarErrorBoundary } from '@scalar/components'
import { computed, type Component } from 'vue'

// This will be populated by the file search in agent mode
type Preview = {
  component: Component
  props: Record<string, any>
}

// Use Vite's glob import to find all preview files
const previewModules = import.meta.glob<{ preview: Preview }>(
  '../../../**/*.preview.ts',
  {
    eager: true,
  },
)

// Transform the modules into a cleaner structure
const files = computed(() => {
  const result: Record<
    string,
    (Preview & {
      _key: string
      _name: string
      _path: string
      _exportKey: string
      _position: number
    })[]
  > = {}

  for (const path in previewModules) {
    if (path) {
      const name = getNameFromPath(path)

      if (!result[path]) {
        result[path] = []
      }

      // Convert exports to array and preserve their order
      const entries = Object.entries(previewModules[path])
        .filter(([key]) => key !== 'default') // Skip default export if present
        .map(([exportKey, value], index) => ({
          ...value,
          _key: `${path}.${exportKey}`,
          _path: path,
          _exportKey: exportKey,
          _position: index,
        }))
        .sort((a, b) => b._position - a._position)

      result[path].push(...entries)
    }
  }

  return result
})

function getNameFromPath(path: string) {
  return path.split('/').pop()?.replace('.preview.ts', '') || ('' as string)
}
</script>

<template>
  <div
    class="light-mode scalar-app scalar-api-reference references-layout references-sidebar app">
    <template
      v-for="(previews, _path) in files"
      :key="_path">
      <h1>{{ getNameFromPath(_path) }}.vue</h1>
      <div class="components">
        <ul>
          <li
            v-for="preview in previews"
            class="preview"
            :key="preview._key">
            <div class="preview-badge">
              {{ preview._exportKey }}
            </div>
            <div class="preview-component">
              <ScalarErrorBoundary>
                <component
                  :is="preview.component"
                  v-bind="preview.props ?? {}" />
              </ScalarErrorBoundary>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
h1 {
  font-weight: bold;
  margin: 1rem 0;
}

.app {
  padding: 0 1rem;
}

ul {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.preview {
  list-style: none;

  position: relative;
}

.preview-component {
  border: 1px solid #eee;
  padding: 1rem;
}

.preview-badge {
  font-family: monospace;
  color: #666;
  background-color: #eee;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  display: inline-block;
  border-radius: 0.25rem 0.25rem 0 0;
}
</style>
