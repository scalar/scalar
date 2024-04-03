<script lang="ts" setup>
import { ScalarCodeBlock } from '@scalar/components'
import { getExampleFromSchema, prettyPrintJson } from '@scalar/oas-utils'

defineProps<{
  response:
    | undefined
    | {
        example?: any
        schema?: any
      }
}>()

const rules = ['oneOf', 'anyOf', 'not']

const mergeAllObjects = (items: Record<any, any>[]): any => {
  return items.reduce((acc, object) => {
    return {
      ...acc,
      ...object,
    }
  }, {})
}
</script>
<template>
  <div v-if="response?.example">
    <ScalarCodeBlock
      :content="prettyPrintJson(response?.example)"
      lang="json" />
  </div>
  <div v-else-if="response?.schema">
    <!-- Single Schema -->
    <ScalarCodeBlock
      v-if="response?.schema.type"
      :content="
        prettyPrintJson(
          getExampleFromSchema(response?.schema, {
            emptyString: '…',
            mode: 'read',
          }),
        )
      "
      lang="json" />
    <!-- oneOf, anyOf, not … -->
    <template
      v-for="rule in rules"
      :key="rule">
      <div
        v-if="
          response?.schema[rule] &&
          (response?.schema[rule].length > 1 || rule === 'not')
        "
        class="rule">
        <div class="rule-title">
          {{ rule }}
        </div>
        <ol class="rule-items">
          <li
            v-for="(example, index) in response?.schema[rule]"
            :key="index"
            class="rule-item">
            <ScalarCodeBlock
              :content="
                getExampleFromSchema(example, {
                  emptyString: '…',
                  mode: 'read',
                })
              "
              lang="json" />
          </li>
        </ol>
      </div>
      <ScalarCodeBlock
        v-else-if="
          response?.schema[rule] && response?.schema[rule].length === 1
        "
        :content="
          getExampleFromSchema(response?.schema[rule][0], {
            emptyString: '…',
            mode: 'read',
          })
        "
        lang="json" />
    </template>
    <!-- allOf-->
    <ScalarCodeBlock
      v-if="response?.schema['allOf']"
      :content="
        mergeAllObjects(
          response?.schema['allOf'].map((schema: any) =>
            getExampleFromSchema(schema, {
              emptyString: '…',
              mode: 'read',
            }),
          ),
        )
      "
      lang="json" />
  </div>
  <div
    v-else
    class="empty-state">
    No Body
  </div>
</template>

<style scoped>
.empty-state {
  margin: 10px 0 10px 12px;
  text-align: center;
  font-size: var(--scalar-micro);
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--scalar-radius-lg);
  color: var(--scalar-color-2);
}

.rule-title {
  font-family: var(--scalar-font-code);
  color: var(--scalar-color-1);
  display: inline-block;
  margin: 12px 0 6px;
  border-radius: var(--scalar-radius);
}

.rule {
  margin: 0 12px 0;
  border-radius: var(--scalar-radius-lg);
}

.rule-items {
  counter-reset: list-number;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-left: 1px solid var(--scalar-border-color);
  padding: 12px 0 12px;
}
.rule-item {
  counter-increment: list-number;
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
  margin-left: 24px;
}
.rule-item:before {
  /* content: counter(list-number); */
  border: 1px solid var(--scalar-border-color);
  border-top: 0;
  border-right: 0;
  content: ' ';
  display: block;
  width: 24px;
  height: 6px;
  border-radius: 0 0 0 var(--scalar-radius-lg);
  margin-top: 6px;
  color: var(--scalar-color-2);
  transform: translateX(-25px);
  color: var(--scalar-color-1);
  position: absolute;
}
</style>
