<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="playground-nav">
    <RouterLink to="/asyncapi">AsyncAPI Code Examples</RouterLink>
    <RouterLink to="/">Code Example Blocks</RouterLink>
    <RouterLink to="/specification-extensions">
      Specification Extensions
    </RouterLink>
    <RouterLink to="/schemas">Schema Blocks</RouterLink>
    <RouterLink to="/api-reference-light">API Reference Light</RouterLink>
  </nav>
  <main class="playground-main">
    <RouterView />
  </main>
</template>
