<script setup lang="ts">
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { onMounted, ref, useId, watch } from 'vue'

const props = defineProps<{
  /**
   * The `x-mermaid` extension value: raw Mermaid diagram source. `SpecificationExtension` binds
   * the raw `x-mermaid` key via `v-bind`, which Vue's runtime prop resolution camelizes before
   * matching — the prop must be declared (and read) in its camelCase form to receive it.
   */
  xMermaid?: unknown
}>()

const { isDarkMode } = useColorMode()

const baseId = `mermaid-${useId()}`
const svg = ref<string>('')
const error = ref<string>('')

/**
 * Monotonic counter identifying the most recent render. `mermaid.render` mutates and then removes a
 * temporary DOM node keyed by the id it is given, so two overlapping renders that share an id clobber
 * each other and one resolves to an empty diagram. The mount does trigger overlapping renders — the
 * initial one plus a color-mode change once `useColorMode` resolves the system preference — so each
 * call gets its own id (`baseId-token`), and the token also guards the write so only the newest
 * render's result reaches the DOM, never a slower stale one.
 */
let renderToken = 0

/**
 * Renders the diagram source into `svg`. `mermaid` is dynamically imported here rather than at
 * module scope, so it is only ever fetched/parsed when a document actually uses `x-mermaid` and
 * this component mounts — consumers who never register this plugin, and documents that never use
 * the extension, pay nothing for it.
 */
const render = async () => {
  const token = ++renderToken
  const id = `${baseId}-${token}`
  const source = typeof props.xMermaid === 'string' ? props.xMermaid : ''
  if (!source.trim()) {
    svg.value = ''
    error.value = ''
    return
  }

  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: isDarkMode.value ? 'dark' : 'default',
    })
    const result = await mermaid.render(id, source)
    // A newer render started while this one was awaiting; let it win rather than overwrite it.
    if (token !== renderToken) {
      return
    }
    svg.value = result.svg
    error.value = ''
  } catch (cause) {
    if (token !== renderToken) {
      return
    }
    svg.value = ''
    // The template already prefixes "Failed to render Mermaid diagram:", so keep this to the
    // underlying reason to avoid repeating that sentence when the cause is not an `Error`.
    error.value = cause instanceof Error ? cause.message : 'Unknown error.'
  } finally {
    // mermaid appends a temporary `d<id>` node to <body> to measure the diagram. It removes that
    // node on success but leaves it behind — holding its "Syntax error" graphic — when the source
    // fails to parse, so remove it here to keep failed renders from piling orphaned diagrams onto
    // the page.
    document.getElementById(`d${id}`)?.remove()
  }
}

onMounted(render)
watch(() => props.xMermaid, render)
watch(isDarkMode, render)
</script>

<template>
  <div
    v-if="svg"
    class="scalar-mermaid-diagram"
    v-html="svg" />
  <div
    v-else-if="error"
    class="scalar-mermaid-diagram-error">
    Failed to render Mermaid diagram: {{ error }}
  </div>
</template>

<style scoped>
.scalar-mermaid-diagram {
  margin: 16px 0;
  overflow-x: auto;
}
.scalar-mermaid-diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}
.scalar-mermaid-diagram-error {
  margin: 16px 0;
  padding: 8px 12px;
  border-radius: var(--scalar-radius, 4px);
  border: 1px solid var(--scalar-border-color, #e5e5e5);
  color: var(--scalar-color-2, #666);
  font-size: 0.875em;
}
</style>
