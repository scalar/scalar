<script setup lang="ts">
import { RenderedReference, type Spec } from '@scalar/api-reference'
import { parseSwaggerDescription } from '@scalar/use-markdown'
import { onMounted, reactive } from 'vue'

onMounted(() => {
  console.log(parseSwaggerDescription('# HI'))
})

const reactiveSpec = reactive<Spec>({
  info: {
    title: '',
    description: '',
    termsOfService: '',
    version: '',
    license: {
      name: '',
      url: '',
    },
    contact: {
      email: '',
    },
  },
  externalDocs: {
    description: '',
    url: '',
  },
  servers: [],
  tags: [],
})
</script>

<template>
  <div>
    <RenderedReference
      class="references-rendered"
      :parsedSpec="reactiveSpec"
      :rawSpec="''"
      :ready="true" />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
