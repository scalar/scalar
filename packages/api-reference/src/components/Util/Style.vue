<!--
  Style tag injection utility

  We have to use this to inject stylesheets dynamically into the
  page right now because we can't inject into <head> in SSR

  We should test out useHead for this instead since it is not best practice
-->
<!-- eslint-disable -->
<template>
  <component
    :is="'style'"
    v-html="$slots.default" />
</template>
