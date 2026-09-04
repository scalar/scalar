<script setup lang="ts">
import type {
  ReferenceType,
  SchemaObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { getTypeSignatureTokens } from './helpers/get-type-signature-tokens'

/**
 * The type of a property as a run of tokens rather than a single string:
 * identifiers in the code face, English words like `array of` in the sans face,
 * and a muted `|` so `string | null` reads as one type with an alternative.
 */
const {
  schema,
  hideModelNames = false,
  modelName,
} = defineProps<{
  schema?: SchemaObject | ReferenceType<SchemaObject>
  /** Render model refs as plain types instead of names */
  hideModelNames?: boolean
  /**
   * The resolved model name, when the caller knows it: an already-dereferenced
   * schema reads as a plain `object`, and the name is the better type.
   */
  modelName?: string | null
}>()

const tokens = computed(() => {
  const computedTokens = getTypeSignatureTokens(schema, { hideModelNames })

  if (!modelName) {
    return computedTokens
  }

  /*
   * A `$ref` renders as the raw component key while the heading link, the
   * models section and the legacy layout show the target's `title`; the
   * caller's name keeps them in agreement. Only a `$ref` may be renamed: an
   * inline schema's single token is its real type (`integer`), not its `title`.
   */
  const isRef = (value: unknown): boolean =>
    !!value && typeof value === 'object' && '$ref' in value

  // Nothing to render, or a bare `object` that the name describes better.
  if (
    computedTokens.length === 0 ||
    (computedTokens.length === 1 && computedTokens[0]?.text === 'object')
  ) {
    return [{ kind: 'ident', text: modelName } as const]
  }

  // A direct `$ref`: the single identifier IS the raw key.
  if (
    isRef(schema) &&
    computedTokens.length === 1 &&
    computedTokens[0]?.kind === 'ident' &&
    computedTokens[0]?.text !== modelName
  ) {
    return [{ kind: 'ident', text: modelName } as const]
  }

  /*
   * An array of a `$ref` keeps its "array of" word and renames only the item.
   * Only a caller name with a trailing `[]` describes the ITEM; the caller also
   * reports the array's OWN name here (a `$ref` to `FilterList`, an inline
   * `title` of `Planets`), and using that would claim each element is one.
   */
  const items =
    schema && typeof schema === 'object' && 'items' in schema
      ? schema.items
      : undefined

  if (
    isRef(items) &&
    computedTokens.length === 2 &&
    computedTokens[0]?.kind === 'word' &&
    computedTokens[1]?.kind === 'ident'
  ) {
    if (modelName.endsWith('[]')) {
      const itemName = modelName.slice(0, -2)

      if (itemName && itemName !== computedTokens[1]?.text) {
        return [computedTokens[0], { kind: 'ident', text: itemName } as const]
      }
    }
  }

  return computedTokens
})
</script>
<template>
  <span
    v-if="tokens.length"
    class="property-type-signature text-c-2 text-(length:--scalar-mini)">
    <template
      v-for="(token, index) in tokens"
      :key="index">
      {{ index > 0 ? ' ' : ''
      }}<span
        class="property-type-token"
        :class="[
          `property-type-token--${token.kind}`,
          token.kind === 'word' ? 'font-sans' : '',
          token.kind === 'ident' || token.kind === 'literal' ? 'font-code' : '',
          token.kind === 'punctuation' ? 'text-c-3' : '',
        ]"
        >{{ token.text }}</span
      >
    </template>
  </span>
</template>
