<script setup lang="ts">
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import { computed } from 'vue'

const { configuration } = defineProps<{
  configuration: Partial<ApiReferenceConfiguration>
}>()

const parsedConfiguration = computed(() =>
  apiReferenceConfigurationSchema.parse(configuration),
)

// TODO: We can't assume it’s always OpenAPI 3.1 and always content, we need the new store here. :)
const content = computed(() => parsedConfiguration.value.content)
</script>

<template>
  <pre>
# {{ content.info.title }} ({{ content.info.version }})

OpenAPI {{ content.openapi }}

<template v-if="content.info.description">{{ content.info.description }}</template>
</pre>
</template>
