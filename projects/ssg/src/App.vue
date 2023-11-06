<script setup lang="ts">
import { RenderedReference, Sidebar, type Spec } from '@scalar/api-reference'
import { reactive } from 'vue'

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
    <Sidebar
      :isDarkMode="true"
      :parsedSpec="reactiveSpec"
      @toggleDarkMode="() => {}" />
    <RenderedReference
      class="references-rendered"
      :parsedSpec="reactiveSpec"
      :rawSpec="''"
      :ready="true" />
  </div>
</template>
