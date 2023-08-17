<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import '@scalar/api-reference/dist/style.css'
import '@scalar/api-client/dist/style.css'
import '@scalar/swagger-editor/dist/style.css'
</script>

<template>
  <ApiReference :is-editable="true" />
</template>
