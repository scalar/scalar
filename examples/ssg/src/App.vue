<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'

import '@scalar/api-reference/style.css'
</script>

<template>
  <div>
    <ApiReference
      :configuration="{
        url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
      }" />
  </div>
</template>
