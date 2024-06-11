<script setup lang="ts">
import Sidebar from '@/components/Sidebar/Sidebar.vue'
import { themeClasses } from '@/constants'
</script>
<template>
  <Sidebar>
    <template #title>Workspace Name</template>
  </Sidebar>
  <div :class="[themeClasses.view]">SCHEMA!!</div>
</template>
<style scoped></style>
