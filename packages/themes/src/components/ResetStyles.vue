<script setup lang="ts">
import { useCssModule } from 'vue'

import { useApplyClasses } from '../hooks/useApplyClasses'

const { reset } = useCssModule()

// Add the reset to the headless UI root as well if there is one
useApplyClasses('#headlessui-portal-root', reset)
</script>
<template>
  <slot :styles="reset" />
</template>
<style lang="postcss" module>
/* Use :where to lower specificity to 0 */
:where(.reset) :global {
  /** Add some more things which are normally applied to `html`. */
  font-family: var(--scalar-font);
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;

  /** Make sure box-sizing is set properly. */
  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  /** Smooth text rendering */
  * {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* prettier-ignore */
  h1, h2, h3, h4, h5, h6, i, p, ol, ul, dl, dd, dt, em, strong, button {
    margin: unset;
    padding: unset;
    color: unset;
    font-weight: unset;
    font-style: unset;
  }

  button {
    border: unset;
    background: unset;
    appearance: unset;
    font-family: var(--scalar-font);
  }

  input::placeholder {
    color: var(--scalar-color-3);
    font-family:
      var(--scalar-font),
      'Inter',
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      'Open Sans',
      'Helvetica Neue',
      sans-serif;
  }
  input:-ms-input-placeholder {
    color: var(--scalar-color-3);
    font-family: var(--scalar-font);
  }
  input::-webkit-input-placeholder {
    color: var(--scalar-color-3);
    font-family: var(--scalar-font);
  }
}
</style>
