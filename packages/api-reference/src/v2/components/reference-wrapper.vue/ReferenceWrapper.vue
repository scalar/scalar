<script>
/**
 * This component is used to wrap any component which MAY be a reference.
 *
 * It will handle the following states:
 *  - success: the component is not a reference
 *  - error: the component is a reference but the reference is not found OR there was an error with the external reference
 *  - loading: the component is an external reference which has not yet been resolved
 *
 * Once wrapped in this component, you can use the type helper `Dereference` to get the deferenced type.
 *
 * @example
 * <ReferenceWrapper>
 *   <Component />
 * </ReferenceWrapper>
 */
export default {
  name: 'ReferenceWrapper',
}
</script>
<template>
  <slot />
</template>
