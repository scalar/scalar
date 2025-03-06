<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const configuration = reactive(
  apiReferenceConfigurationSchema.parse({
    theme: `${route.params['theme']}`,
    isEditable: false,
    layout: `${route.params['layout']}`,
    darkMode: !!route.query['darkMode'],
    content,
  }),
)
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
