<script lang="ts">
/** We use this global var to ensure that we only show loading once on config change */
const hasLoaded = ref(false)
</script>
<script lang="ts" setup>
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type {
  Spec,
  Tag as TagType,
  TransformedOperation,
} from '@scalar/types/legacy'
import { onMounted, ref, watch } from 'vue'

import { Anchor } from '@/components/Anchor'
import { lazyBus } from '@/components/Content/Lazy/lazyBus'
import { Schema } from '@/components/Content/Schema'
import { TagSection } from '@/components/Content/Tag'
import {
  Section,
  SectionContainer,
  SectionContent,
  SectionHeader,
  SectionHeaderTag,
} from '@/components/Section'
import { Operation } from '@/features/Operation'
import { scrollToId } from '@/helpers/scroll-to-id'
import { useNavState } from '@/hooks/useNavState'
import { getModels } from '@/libs/openapi'

/**
 * Loads a "fake" tag/modal/operation if the user is deep linking
 * The fake popup is then hidden once the real one loads behind it
 * Giving a seemless instant load experience
 *
 * TODO list
 * - only works on first load, but we will use this when
 *   hitting endpoint links in V2
 * - only works for default layout, add classic (if we need)
 * - code is ripe for refactor as it is duplicated from content and models
 * - need to handle case of last operation/model
 * - need to find an event for codemirror loaded, currently using timeout for models
 */
const props = withDefaults(
  defineProps<{
    collection: Collection
    server?: Server
    layout?: 'modern' | 'classic'
    parsedSpec: Spec
  }>(),
  { layout: 'modern' },
)

const hideTag = ref(false)

const tags = ref<(TagType & { lazyOperations: TransformedOperation[] })[]>([])
const models = ref<string[]>([])

const { getModelId, getSectionId, getTagId, hash, isIntersectionEnabled } =
  useNavState()

const isLoading = ref(
  !hasLoaded.value && props.layout !== 'classic' && hash.value,
)

// Ensure we have a spec loaded
watch(
  () => props.parsedSpec.tags?.length,
  (tagsLength) => {
    if (
      !hash.value ||
      typeof tagsLength !== 'number' ||
      !props.parsedSpec.tags
    ) {
      return
    }

    const sectionId = getSectionId()

    // Grab specific tag to load
    if (sectionId.startsWith('tag')) {
      let operationIndex = 0
      const tagIndex =
        props.parsedSpec.tags?.findIndex(
          (tag) => getTagId(tag) === sectionId,
        ) ?? 0

      // Grab specific operation to load
      const operationMatches = hash.value.match(/tag\/([^/]+)\/([^/]+)\/(.+)/)
      if (operationMatches?.length === 4) {
        const matchedVerb = operationMatches[2]
        const matchedPath = '/' + operationMatches[3]

        operationIndex = props.parsedSpec.tags[tagIndex]?.operations.findIndex(
          ({ httpVerb, path }) =>
            matchedVerb === httpVerb && matchedPath === path,
        )
      }
      // Add a few tags to the loading section
      const tag = props.parsedSpec.tags[tagIndex]

      if (!tag) {
        return
      }
      if (tag.name !== 'default') {
        hideTag.value = sectionId !== hash.value && sectionId.startsWith('tag')
      }

      tags.value.push({
        ...tag,
        lazyOperations: tag.operations.slice(
          operationIndex,
          operationIndex + 2,
        ),
      })
    }
    // Models
    else if (hash.value.startsWith('model')) {
      const modelKeys = Object.keys(getModels(props.parsedSpec) ?? {})
      const [, modelKey] = hash.value.toLowerCase().split('/')

      // Find the right model to start at
      const modelIndex =
        hash.value === 'models'
          ? 0
          : modelKeys.findIndex((key) => key.toLowerCase() === modelKey)

      if (modelIndex === -1) {
        return
      }

      // Display a couple models
      models.value = modelKeys.slice(modelIndex, modelIndex + 3)
    }
    // Descriptions
    else {
      if (typeof window !== 'undefined') {
        scrollToId(hash.value)
      }
      setTimeout(() => (isIntersectionEnabled.value = true), 1000)
    }
  },
  { immediate: true },
)

// Scroll to hash when component has rendered
const unsubscribe = lazyBus.on(({ id }) => {
  const hashStr = hash.value
  if (!hashStr || id !== hashStr) {
    return
  }

  // Unsubscribe once our element has loaded
  unsubscribe()

  // Timeout is to allow codemirror to finish loading and prevent layout shift
  // TODO mutation observer
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      scrollToId(hashStr)
    }
    isLoading.value = false
    hasLoaded.value = true

    setTimeout(() => {
      isIntersectionEnabled.value = true
    }, 1000)
  }, 300)
})

// Enable intersection observer withb timeout when not deep linking
onMounted(() => {
  if (!hash.value) {
    hasLoaded.value = true

    setTimeout(() => {
      isIntersectionEnabled.value = true
    }, 1000)
  }
})
</script>
<template>
  <div
    v-show="isLoading"
    class="references-loading"
    :class="{
      'references-loading-hidden-tag': hideTag,
      'references-loading-top-spacer': tags.length,
    }">
    <!-- Tags -->
    <template
      v-for="(tag, idx) in tags"
      :key="tag.name + idx">
      <TagSection
        v-if="tag.operations && tag.operations.length > 0"
        :collection="collection"
        :spec="parsedSpec"
        :tag="tag">
        <Operation
          v-for="operation in tag.lazyOperations"
          :key="`${operation.httpVerb}-${operation.operationId}`"
          :collection="collection"
          :layout="layout"
          :server="server"
          :transformedOperation="operation" />
      </TagSection>
    </template>

    <!-- Models -->
    <SectionContainer v-if="models.length">
      <Section
        v-for="name in models"
        :key="name"
        :label="name">
        <template v-if="getModels(parsedSpec)?.[name]">
          <SectionContent>
            <SectionHeader>
              <Anchor :id="getModelId({ name })">
                <SectionHeaderTag :level="2">
                  {{
                    (getModels(parsedSpec)?.[name] as OpenAPIV3_1.SchemaObject)
                      .title ?? name
                  }}
                </SectionHeaderTag>
              </Anchor>
            </SectionHeader>
            <Schema
              :name="name"
              noncollapsible
              :value="getModels(parsedSpec)?.[name]" />
          </SectionContent>
        </template>
      </Section>
    </SectionContainer>
  </div>
</template>
<style>
.references-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1;
  grid-area: rendered;
  background: var(--scalar-background-1);
}
.references-loading-top-spacer {
  top: -1px;
}
/* This doesn't seem to work but leaving here in case we need it */
/* @media (min-width: 1001px) {
  .references-loading-top-spacer {
    top: calc(var(--scalar-custom-header-height, --refs-header-height) - 1px);
  }
} */
.references-loading-hidden-tag .section-container > .section:first-child {
  display: none;
}
</style>
