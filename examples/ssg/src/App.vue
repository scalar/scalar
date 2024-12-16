<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <div>
    <ApiReference
      :configuration="{
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
      }" />
  </div>
</template>
