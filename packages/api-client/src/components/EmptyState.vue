<script setup lang="ts">
import Keycap from '@/assets/keycap.ascii?raw'

import ScalarAsciiArt from './ScalarAsciiArt.vue'
import ScalarHotkey from './ScalarHotkey.vue'
</script>
<template>
  <div class="scale-75 flex flex-center w-full">
    <div class="relative">
      <ScalarHotkey
        class="keycap-hotkey"
        hotkey="" />
      <ScalarAsciiArt
        :art="Keycap"
        class="!leading-[6px] text-c-3" />
    </div>
    <div class="relative -ml-12">
      <div class="keycap-hotkey !right-[60px]">K</div>
      <ScalarAsciiArt
        :art="Keycap"
        class="!leading-[6px] keycap-n" />
    </div>
  </div>
</template>
<style scoped>
.keycap-n {
  background: -webkit-linear-gradient(
    5deg,
    transparent 30%,
    var(--scalar-color-3) 50%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.keycap-hotkey {
  color: var(--scalar-color-1);
  font-size: 26px;
  position: absolute;
  top: 32px;
  right: 54px;
  font-weight: 200;
  height: 26px;
  line-height: 26px;
  border: none;
  font-weight: 400;
  font-family: var(--scalar-font);
}
</style>
