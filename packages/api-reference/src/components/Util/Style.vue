<!--
  Style tag injection utility

  We have to use this to inject stylesheets dynamically into the
  page right now because we can't inject into <head> in SSR
-->
<script lang="ts">
/**
 * @deprecated do not use this component, just import the css normally
 */
export default {
  name: 'StyleComponent',
}
</script>

<template>
  <component :is="'style'"><slot /></component>
</template>
