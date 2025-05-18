<script setup lang="ts">
import { ScalarCodeBlock, ScalarErrorBoundary } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import { getExampleFromSchema } from '@scalar/oas-utils/spec-getters'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import type { Spec, Tag as TagType } from '@scalar/types/legacy'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Card, CardContent, CardHeader } from '@/components/Card'
import { Lazy } from '@/components/Content/Lazy'
import { Schema, SchemaHeading } from '@/components/Content/Schema'
import {
  CompactSection,
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'

const { component } = defineProps<{
  id: string
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
  component: any
}>()

const labelId = useId()
const title = computed(() => component.title ?? component.name)
</script>
<template>
  <Section
    :id="id"
    :aria-labelledby="labelId"
    :label="title"
    tabindex="-1">
    <SectionContent>
      <SectionHeader>
        <Anchor :id="id ?? ''">
          <SectionHeaderTag
            :id="id"
            :level="3">
            {{ title }}
          </SectionHeaderTag>
        </Anchor>
      </SectionHeader>
      <SectionColumns>
        <SectionColumn>
          <Schema
            :hideHeading="true"
            noncollapsible
            :schemas="schemas"
            :value="component" />
        </SectionColumn>
        <SectionColumn>
          <Card class="scalar-card-sticky">
            <CardHeader>
              {{ title }}
            </CardHeader>
            <div class="custom-scroll">
              <CardContent muted>
                <ScalarCodeBlock
                  class="bg-b-2 -outline-offset-2"
                  :content="
                    getExampleFromSchema(component, {
                      emptyString: 'string',
                      mode: 'read',
                    })
                  "
                  lang="json" />
              </CardContent>
            </div>
          </Card>
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>
