<script setup lang="ts">
import Keycap from '@/assets/keycap.ascii?raw'

import ScalarAsciiArt from './ScalarAsciiArt.vue'
import ScalarHotkey from './ScalarHotkey.vue'
</script>
<template>
  <div class="flex-center flex w-full scale-75">
    <div class="relative">
      <ScalarHotkey
        class="keycap-hotkey right-14 border-transparent text-xl"
        hotkey="" />
      <ScalarAsciiArt
        :art="Keycap"
        class="text-c-3 !leading-[6px]" />
    </div>
    <div class="relative -ml-12">
      <div class="keycap-hotkey right-16 text-xl">K</div>
      <ScalarAsciiArt
        :art="Keycap"
        class="keycap-n !leading-[6px]" />
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
  position: absolute;
  top: 32px;
  line-height: 26px;
}
</style>
