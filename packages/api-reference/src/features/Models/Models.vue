<script setup lang="ts">
import { ScalarErrorBoundary } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, TagComponent, Tag as TagType } from '@scalar/types/legacy'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Lazy } from '@/components/Content/Lazy'
import { useNavState } from '@/hooks/useNavState'

import Model from './Model.vue'

const { components } = defineProps<{
  tag: TagType
  schemas:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
  components: TagComponent[]
}>()

const { getModelId } = useNavState()
</script>
<template>
  <div class="models-list">
    <Lazy
      v-for="component of components ?? []"
      :id="getModelId({ name: component.name }, tag)"
      :key="component.name"
      isLazy>
      <ScalarErrorBoundary>
        <Model
          :id="getModelId({ name: component.name }, tag)"
          :schemas="schemas"
          :component="component.schema" />
      </ScalarErrorBoundary>
    </Lazy>
  </div>
</template>
