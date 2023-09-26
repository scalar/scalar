<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'

// import specResult from '../fixtures/specResult.json'
</script>

<template>
  <ApiReference
    isEditable
    proxyUrl="http://localhost:5051" />
  <!-- <ApiReference isEditable /> -->
  <!-- <ApiReference :specUrl="/swagger.json" /> -->
  <!-- <ApiReference :spec="{ … }" /> -->
  <!-- <ApiReference :specResult="specResult" /> -->
</template>
