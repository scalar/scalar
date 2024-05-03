<script setup lang="ts">
/**
 * There will be a point in time where someone looks at this component and wonders why it’s here. If this is you:
 *
 * This component is here to import the fonts from the `fonts.css` file. We can’t just use a regular import because it
 * would be a global import and would be sent to the client in all cases, even if the component isn’t rendered.
 *
 * This component is a workaround to only import the fonts when the component is rendered.
 */
import fonts from '../fonts.css?inline'
</script>

<template>
  <!-- 
    Temp workaround for SSR
    We should stop using <component :is="style or script"> as its an anti pattern
    @see https://github.com/vuejs/core/issues/7775
  -->
  <!-- eslint-disable vue/no-v-text-v-html-on-component -->
  <component
    :is="'style'"
    v-html="fonts">
  </component>
</template>
