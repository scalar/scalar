<script setup lang="ts">
import { ApiReference, type ReferenceLayoutType } from '@scalar/api-reference'
import content from '@scalar/galaxy/latest.yaml?raw'
import type { ThemeId } from '@scalar/themes'
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
    spec: { content },
  }),
)
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
