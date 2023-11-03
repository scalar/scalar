<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference
    :initialTabState="'Swagger Editor'"
    :isEditable="true"
    specUrl="/scalar.json" />
</template>
