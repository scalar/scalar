<!--
  Style tag injection utility

  We have to use this to inject stylesheets dynamically into the
  page right now because we can't inject into <head> in SSR
-->
<template>
  <component :is="'style'"><slot /></component>
</template>
