<script lang="ts" setup>
import content from '../../../../examples/web/src/fixtures/petstorev3.json'
import ApiReferenceNuxt from '../components/ApiReferenceNuxt.vue'

useHead({
  title: 'Scalar API Reference',
})
</script>

<template>
  <ApiReferenceNuxt
    :configuration="{
      showSidebar: true,
      // spec: { url: 'https://petstore.swagger.io/v2/swagger.json' },
      spec: { content },
    }">
  </ApiReferenceNuxt>
</template>
