<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { ApiReference } from '@scalar/api-reference'
</script>

<template>
  <ApiReference
    :configuration="{
      url: 'https://petstore.swagger.io/v2/swagger.json',
    }" />
</template>
