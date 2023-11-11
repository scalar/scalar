<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference
    :initialTabState="'Swagger Editor'"
    :isEditable="true"
    proxyUrl="https://api.scalar.com/request-proxy" />
</template>
