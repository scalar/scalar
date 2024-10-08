<script lang="ts" setup>
// import { RouterView } from 'vue-router'

/** This simulates an existing app, that is unrelated to our package and has its own router, but uses our component and hooks into the router. */
</script>

<template>
  <div class="scalar-app">
    <div class="p-3 pb-0">
      <div class="border p-3 flex gap-4 font-code">
        <RouterLink :to="{ name: 'home' }">Home</RouterLink>
        <!-- <RouterLink :to="{ name: 'scalar' }">Scalar API Reference</RouterLink> -->
      </div>
    </div>
    router view comes here
    <div>$router: {{ $router }}</div>
    <!-- <RouterView /> -->
  </div>
</template>
