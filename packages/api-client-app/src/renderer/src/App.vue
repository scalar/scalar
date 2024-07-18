<script setup lang="ts">
import ApiClient from './components/ApiClient.vue'
import FileDrop from './components/FileDrop.vue'
</script>

<template>
  <FileDrop>
    <ApiClient />
  </FileDrop>
</template>
<style>
.t-app__top-nav {
  padding-left: 75px !important;
}
</style>
