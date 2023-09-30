<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { ref } from 'vue'

const activeTheme = ref<ThemeId>('default')

// import specResult from '../fixtures/specResult.json'
</script>

<template>
  <ApiReference
    isEditable
    proxyUrl="http://localhost:5051"
    :theme="activeTheme"
    @changeTheme="activeTheme = $event" />
  <!-- <ApiReference isEditable theme="moon" /> -->
  <!-- <ApiReference :specUrl="/swagger.json" /> -->
  <!-- <ApiReference :spec="{ … }" /> -->
  <!-- <ApiReference :specResult="specResult" /> -->
</template>
