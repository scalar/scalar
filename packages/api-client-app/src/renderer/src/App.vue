<script setup lang="ts">
import ApiClient from './components/ApiClient.vue'
import FileDrop from './components/FileDrop.vue'
import TitleBar from './components/TitleBar.vue'
</script>

<template>
  <FileDrop>
    <TitleBar />
    <ApiClient />
  </FileDrop>
</template>
