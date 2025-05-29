<script setup lang="ts">
import { ApiReference } from '@/index'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
    }" />
</template>
