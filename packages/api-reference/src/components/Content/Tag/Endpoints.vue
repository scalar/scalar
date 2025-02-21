<script setup lang="ts">
import { isOperationDeprecated } from '@/helpers/operation'
import { ScalarMarkdown } from '@scalar/components'
import type { Tag, TransformedOperation } from '@scalar/types/legacy'
import { computed } from 'vue'

import { useNavState, useSidebar } from '../../../hooks'
import { Anchor } from '../../Anchor'
import { Card, CardContent, CardHeader } from '../../Card'
import { HttpMethod } from '../../HttpMethod'
import ScreenReader from '../../ScreenReader.vue'
import {
  Section,
  SectionColumn,
  SectionColumns,
  SectionContent,
  SectionHeader,
} from '../../Section'

const props = defineProps<{ id?: string; tag: Tag; isCollapsed?: boolean }>()

const { getOperationId, getTagId } = useNavState()
const { scrollToOperation } = useSidebar()

const tagName = computed(() => props.tag['x-displayName'] ?? props.tag.name)

// TODO in V2 we need to do the same loading trick as the initial load
const scrollHandler = async (operation: TransformedOperation) => {
  const operationId = getOperationId(operation, props.tag)
  scrollToOperation(operationId)
}
</script>
<template>
  <Section
    :id="id"
    :label="tag.name.toUpperCase()">
    <SectionHeader :level="2">
      <Anchor :id="getTagId(tag)">{{ tagName }}</Anchor>
    </SectionHeader>
    <SectionContent>
      <SectionColumns>
        <SectionColumn>
          <ScalarMarkdown
            :clamp="isCollapsed ? '7' : false"
            :value="tag.description"
            withImages />
        </SectionColumn>
        <SectionColumn>
          <template v-if="tag.operations?.length > 0">
            <Card class="scalar-card-sticky">
              <CardHeader muted>
                <ScreenReader>{{ tagName }}</ScreenReader>
                Endpoints
              </CardHeader>
              <CardContent
                class="custom-scroll"
                muted>
                <ul
                  :aria-label="`${tagName} endpoints`"
                  class="endpoints">
                  <li
                    v-for="operation in tag.operations"
                    :key="getOperationId(operation, tag)"
                    class="contents">
                    <a
                      class="endpoint"
                      :href="`#${getOperationId(operation, tag)}`"
                      @click.prevent="scrollHandler(operation)">
                      <HttpMethod :method="operation.httpVerb" />
                      <span
                        class="endpoint-path"
                        :class="{
                          deprecated: isOperationDeprecated(operation),
                        }">
                        {{ operation.path }}
                      </span>
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </template>
        </SectionColumn>
      </SectionColumns>
    </SectionContent>
  </Section>
</template>
<style scoped>
.endpoints {
  overflow: auto;
  background: var(--scalar-background-2);
  padding: 10px 12px;
}
@media (max-width: 580px) {
  .endpoints {
    max-height: calc(100vh - 150px);
  }
}
.endpoints span + span {
  text-align: left;
  margin-left: 12px;
  text-transform: initial;
}

.endpoint {
  display: flex;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
}
.endpoint:hover .endpoint-path,
.endpoint:focus-visible .endpoint-path {
  text-decoration: underline;
}
.endpoint span:first-of-type {
  text-transform: uppercase;
}
.endpoint .post,
.endpoint .get,
.endpoint .delete,
.endpoint .put {
  white-space: nowrap;
}
.endpoint span {
  color: var(--scalar-color-1);
  min-width: 62px;
  display: inline-block;
  text-align: right;
  line-height: 1.55;
  font-family: var(--scalar-font-code);
  font-size: var(--scalar-small);
  cursor: pointer;
}
.deprecated {
  text-decoration: line-through;
}
</style>
