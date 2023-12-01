<script setup lang="ts">
import { ThemeStyles } from '@scalar/themes'

import PageLink from '../components/PageLink.vue'
</script>
<template>
  <ThemeStyles id="default" />
  <div class="main light-mode">
    <h1>Examples</h1>
    <div class="page-links">
      <PageLink to="standalone-api-reference">
        <template #title>Standalone API Reference</template>
        <template #description>
          Interactive API documentation with pre-configured search
        </template>
      </PageLink>
      <PageLink to="classic-api-reference">
        <template #title>Classic API Reference</template>
        <template #description>
          Classic API documentation with search
        </template>
      </PageLink>
      <PageLink to="api-reference">
        <template #title>API Reference</template>
        <template #description>
          Customizable Interactive API documentations
        </template>
      </PageLink>
      <PageLink to="api-client">
        <template #title>API Client</template>
        <template #description>Your drop-in API Client</template>
      </PageLink>
      <PageLink to="swagger-editor">
        <template #title>Swagger Editor</template>
        <template #description>An editor for Swagger files</template>
      </PageLink>
    </div>
  </div>
</template>

<style scoped>
.main {
  margin: 2rem;
  font-family: 'Inter', sans-serif;
}

h1 {
  font-weight: normal;
  margin-bottom: 2rem;
}

.page-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 1rem;
  /** Make all PageLink elements same height */
}
</style>
