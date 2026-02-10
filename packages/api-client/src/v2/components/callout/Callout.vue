<script setup lang="ts">
import {
  ScalarIconCheckCircle,
  ScalarIconInfo,
  ScalarIconWarning,
  ScalarIconWarningCircle,
} from '@scalar/icons'

type CalloutType = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const { type } = defineProps<{
  type: CalloutType
}>()

const slots = defineSlots<{
  default: () => string
  actions?: () => string
}>()

const iconsMapping = {
  info: ScalarIconInfo,
  success: ScalarIconCheckCircle,
  warning: ScalarIconWarning,
  danger: ScalarIconWarningCircle,
  neutral: ScalarIconInfo,
} satisfies Record<CalloutType, unknown>
</script>

<template>
  <div :class="`callout t-editor__callout callout__${type}`">
    <div class="flex w-full flex-col gap-2">
      <div class="flex items-start gap-2">
        <div
          class="callout-content__icon"
          data-scalar-name="callout-icon">
          <component
            :is="iconsMapping[type]"
            class="size-5 shrink-0" />
        </div>
        <div class="callout-content__text">
          <slots.default />
        </div>
      </div>
      <div
        v-if="slots.actions"
        class="flex justify-end gap-2">
        <slots.actions />
      </div>
    </div>
  </div>
</template>
<style scoped>
/* ----------------------------------------------------- */
/* Custom Callout Styles */

.dark-mode .t-editor__callout,
.light-mode .t-editor__callout {
  --callout-font-size: var(--scalar-small);

  --callout-neutral-primary: var(--scalar-color-3);
  --callout-neutral-secondary: color-mix(
    in srgb,
    var(--scalar-background-2),
    transparent 50%
  );
  --callout-neutral-font-color: var(--scalar-color-1);

  --callout-success-primary: var(--scalar-color-green);
  --callout-success-secondary: color-mix(
    in srgb,
    var(--scalar-color-green),
    transparent 97%
  );
  --callout-success-font-color: var(--scalar-color-1);

  --callout-danger-primary: var(--scalar-color-red);
  --callout-danger-secondary: color-mix(
    in srgb,
    var(--scalar-color-red),
    transparent 97%
  );
  --callout-danger-font-color: var(--scalar-color-1);

  --callout-warning-primary: var(--scalar-color-yellow);
  --callout-warning-secondary: color-mix(
    in srgb,
    var(--scalar-color-yellow),
    transparent 97%
  );
  --callout-warning-font-color: var(--scalar-color-1);

  --callout-info-primary: var(--scalar-color-blue);
  --callout-info-secondary: color-mix(
    in srgb,
    var(--scalar-color-blue),
    transparent 97%
  );
  --callout-info-font-color: var(--scalar-color-1);

  --callout-line-height: 22px;
}

.t-editor__callout {
  border-radius: var(--scalar-radius);
  margin-top: var(--scalar-block-spacing);
  padding: 10px 14px;

  --callout-primary: var(--scalar-border-color);
  --callout-secondary: var(--scalar-background-2);
  --callout-svg: var(--callout-primary);

  background: var(--callout-secondary);
  border: var(--scalar-border-width) solid
    color-mix(in srgb, var(--callout-primary), transparent 50%);
}

.t-editor__callout .callout-content__text {
  font-size: var(--callout-font-size);
  flex: 1 1 0%;
  line-height: var(--callout-line-height);
}

.t-editor__callout .callout-content__icon {
  position: relative;
  border-radius: var(--scalar-radius);
  width: 18px;
  height: fit-content;
  color: var(--callout-svg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.t-editor__callout .callout-content__icon svg,
.t-editor__callout .callout-content__icon img {
  width: 18px;
  height: 18px;
}

/* vertical align icon to text, don't remove this */
.t-editor__callout .callout-content__icon:before {
  content: '\200b';
  line-height: var(--callout-line-height);
}

/* Apply callout colors */
.t-editor__callout.callout__neutral {
  --callout-primary: var(--callout-neutral-primary);
  --callout-secondary: var(--callout-neutral-secondary);
  --callout-font-color: var(--callout-neutral-font-color);
  --callout-svg: var(--callout-neutral-font-color);
}

.t-editor__callout.callout__info {
  --callout-primary: var(--callout-info-primary);
  --callout-secondary: var(--callout-info-secondary);
  --callout-font-color: var(--callout-info-font-color);
  --callout-svg: var(--callout-info-primary);
}

.t-editor__callout.callout__warning {
  --callout-primary: var(--callout-warning-primary);
  --callout-secondary: var(--callout-warning-secondary);
  --callout-font-color: var(--callout-warning-font-color);
  --callout-svg: var(--callout-warning-primary);
}

.t-editor__callout.callout__success {
  --callout-primary: var(--callout-success-primary);
  --callout-secondary: var(--callout-success-secondary);
  --callout-font-color: var(--callout-success-font-color);
  --callout-svg: var(--callout-success-primary);
}

.t-editor__callout.callout__danger {
  --callout-primary: var(--callout-danger-primary);
  --callout-secondary: var(--callout-danger-secondary);
  --callout-font-color: var(--callout-danger-font-color);
  --callout-svg: var(--callout-danger-primary);
}
</style>
