<script lang="ts" setup>
import { RouterView } from 'vue-router'

/** This simulates an existing app, that is unrelated to our package and has its own router, but uses our component and hooks into the router. */
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'home' }">Home</RouterLink>
    <RouterLink :to="{ name: 'scalar' }">Scalar API Reference</RouterLink>
  </div>
  <RouterView />
</template>
