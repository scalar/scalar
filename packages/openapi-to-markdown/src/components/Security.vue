<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OpenApiDocument } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

const { requirements, schemes } = defineProps<{
  requirements?: OpenApiDocument['security']
  schemes?: NonNullable<OpenApiDocument['components']>['securitySchemes']
}>()
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
          <template v-if="schemes?.[name]">
            <pre><code>{{ JSON.stringify(getResolvedRef(schemes[name]!), null, 2) }}</code></pre>
            <ScalarMarkdown
              :value="getResolvedRef(schemes[name]!)?.description" />
          </template>
        </li>
      </ul>
    </template>
  </section>
</template>
