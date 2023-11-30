<script setup lang="ts">
import StartPageLink from '../components/PageLink.vue'
</script>
<template>
  <div
    class="flex items-center justify-center h-screen w-screen bg-gray-50 text-gray-600">
    <div class="grid grid-cols-2 grid-rows-2 gap-4 p-6">
      <StartPageLink to="standalone-api-reference">
        <template #title>Standalone API Reference</template>
        <template #description>
          Interactive API documentation with pre-configured search
        </template>
      </StartPageLink>
      <StartPageLink to="classic-api-reference">
        <template #title>Classic API Reference</template>
        <template #description>Classic API documentation with search</template>
      </StartPageLink>
      <StartPageLink to="api-reference">
        <template #title>API Reference</template>
        <template #description>
          Customizable Interactive API documentations
        </template>
      </StartPageLink>
      <StartPageLink to="api-client">
        <template #title>API Client</template>
        <template #description>Your drop-in API Client</template>
      </StartPageLink>
      <StartPageLink to="swagger-editor">
        <template #title>Swagger Editor</template>
        <template #description>An editor for Swagger files</template>
      </StartPageLink>
      <StartPageLink to="collaborative-editing">
        <template #title>Collaborative Editing</template>
        <template #description>WIP</template>
      </StartPageLink>
    </div>
  </div>
</template>
