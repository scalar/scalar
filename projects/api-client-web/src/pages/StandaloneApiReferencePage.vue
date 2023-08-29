<script setup lang="ts">
import { StandaloneApiReference } from '@scalar/api-reference'

// import '@scalar/api-reference/style.css'
</script>

<template>
  <div data-spec-url="/scalar.json"></div>
  <StandaloneApiReference :is-editable="true" />
</template>
