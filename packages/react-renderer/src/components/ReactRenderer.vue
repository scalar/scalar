<script setup lang="ts">
import type { ComponentType } from 'react'
import { onBeforeUnmount, onMounted, ref, useAttrs } from 'vue'

import { ReactConnector } from './ReactConnector'

const { component } = defineProps<{
  component: ComponentType<any>
}>()

/**
 * Any attributes passed to the component.
 * It seems like this is the only way to get all props without explicitly defining them.
 **/
const attrs = useAttrs()

const containerRef = ref<HTMLElement | null>(null)
let reactComponent: ReactConnector | null = null

onMounted(() => {
  if (!containerRef.value) {
    return
  }

  if (!component) {
    throw new Error('Component is required')
  }

  reactComponent = new ReactConnector(containerRef.value, component)

  /**
   * Transform attributes to props.
   */
  const props = Object.entries(attrs).reduce((acc, [key, value]) => {
    // Omit the `component` prop, we don't need to pass the component down to the component.
    if (key === 'component') {
      return acc
    }

    // The attrs look like this: `{x-custom-extension: 'value'}`,
    // But we want to pass them down as: `{xCustomExtension: 'value'}`
    const camelKey = key.replace(/-[a-z]/g, (match) => match[1]!.toUpperCase())

    return { ...acc, [camelKey]: value }
  }, {})

  // Pass any attributes as props to React
  reactComponent.render(props)
})

onBeforeUnmount(() => {
  // Clean up React component if needed
  if (reactComponent) {
    reactComponent.cleanup()
    reactComponent = null
  }
})
</script>

<template>
  <div ref="containerRef" />
</template>
