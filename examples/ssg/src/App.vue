<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'

import '@scalar/api-reference/style.css'
</script>

<template>
  <div>
    <ApiReference
      :configuration="{
        url: 'https://registry.scalar.com/@scalar/apis/galaxy?format=json',
      }" />
  </div>
</template>
