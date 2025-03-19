<script setup lang="ts">
import { ApiReference } from '@/index'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://petstore.swagger.io/v2/swagger.json',
    }" />
</template>
