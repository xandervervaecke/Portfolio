<script setup lang="ts">
import { onMounted, watch } from 'vue'
import Hero from './components/Hero.vue'
import Desktop from './components/Desktop.vue'
import DetailWindow from './components/DetailWindow.vue'
import { useDesktop } from './composables/useDesktop'
import { useDetail } from './composables/useDetail'

const { desktopOpen, bind } = useDesktop()
const { closeDetail } = useDetail()

onMounted(bind)

// Shutting the desktop takes its document windows with it.
watch(desktopOpen, (open) => {
  if (!open) closeDetail()
})
</script>

<template>
  <div class="shell grid-paper">
    <Hero />
    <Desktop v-if="desktopOpen" />
    <DetailWindow />
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  min-height: 100dvh;
}
</style>
