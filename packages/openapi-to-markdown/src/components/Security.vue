<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const { requirements, schemes } = defineProps<{
  requirements?: OpenApiDocument['security']
  schemes?: NonNullable<OpenApiDocument['components']>['securitySchemes']
}>()

const schemeContent = computed(() =>
  Object.fromEntries(
    Object.entries(schemes ?? {}).map(([name, reference]) => {
      const scheme = getResolvedRef(reference)
      return [
        name,
        {
          json: JSON.stringify(scheme, null, 2),
          description: scheme?.description,
        },
      ]
    }),
  ),
)
</script>

<template>
  <section v-if="requirements">
    <h4>Authentication</h4>
    <p v-if="!requirements.length">No authentication required.</p>
    <template
      v-for="(requirement, index) in requirements"
      :key="index">
      <p v-if="index">Or:</p>
      <p v-if="!Object.keys(requirement).length">No authentication required.</p>
      <ul v-else>
        <li
          v-for="(scopes, name) in requirement"
          :key="name">
          <strong>{{ name }}</strong>
          <template v-if="scopes?.length">
            Scopes: {{ scopes.join(', ') }}
          </template>
          <template v-if="schemeContent[name]">
            <pre><code>{{ schemeContent[name].json }}</code></pre>
            <ScalarMarkdown :value="schemeContent[name].description" />
          </template>
        </li>
      </ul>
    </template>
  </section>
</template>
