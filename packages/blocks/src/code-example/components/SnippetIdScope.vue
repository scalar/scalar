<script setup lang="ts">
/**
 * Gives the code snippet its own `useId()` scope.
 *
 * The snippet area renders either the code block (which takes an id) or the empty placeholder while
 * the generator loads (which takes none). When the browser hydrates before the generator arrives, that
 * difference would shift every id after the snippet, such as the example picker's, and break their
 * ARIA references. Vue scopes the ids of a component that registers a server prefetch hook, on the
 * server and in the browser alike, so wrapping the snippet in one keeps the ids around it stable.
 */
import { onServerPrefetch } from 'vue'

onServerPrefetch(() => undefined)
</script>
<template>
  <slot />
</template>
