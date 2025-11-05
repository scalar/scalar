<script setup lang="ts">
import { ApiReference } from '@/index'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    }" />
</template>
