<script setup lang="ts">
import { StandaloneApiReference } from '@scalar/api-reference'
</script>

<template>
  <div data-spec-url="/scalar.json"></div>
  <StandaloneApiReference :is-editable="true" />
</template>
