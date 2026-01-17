<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
    }" />
</template>
