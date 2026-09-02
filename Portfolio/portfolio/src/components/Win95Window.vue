<script setup lang="ts">
import PixelIcon from './PixelIcon.vue'

withDefaults(
  defineProps<{
    title: string
    icon?: string
    /** Show the minimise button. */
    minimizable?: boolean
    /** Show the maximise/restore button. */
    maximizable?: boolean
    maximized?: boolean
  }>(),
  {
    icon: 'folder',
    minimizable: false,
    maximizable: false,
    maximized: false,
  },
)

defineEmits<{
  close: []
  minimize: []
  maximize: []
}>()
</script>

<template>
  <section class="win">
    <header class="win__bar">
      <span class="win__icon"><PixelIcon :name="icon" :size="14" /></span>
      <span class="win__title t-window">{{ title }}</span>
      <span class="win__grip" aria-hidden="true" />
      <div class="win__sys">
        <button
          v-if="minimizable"
          class="w95-sysbtn"
          type="button"
          title="Minimise — back to the 3D scene"
          aria-label="Minimise"
          @click="$emit('minimize')"
        >
          <PixelIcon name="minimize" :size="10" />
        </button>
        <button
          v-if="maximizable"
          class="w95-sysbtn"
          type="button"
          :title="maximized ? 'Restore' : 'Maximise'"
          :aria-label="maximized ? 'Restore' : 'Maximise'"
          @click="$emit('maximize')"
        >
          <PixelIcon :name="maximized ? 'restore' : 'maximize'" :size="10" />
        </button>
        <button
          class="w95-sysbtn is-close"
          type="button"
          title="Close — back to the 3D scene"
          aria-label="Close"
          @click="$emit('close')"
        >
          <PixelIcon name="close" :size="10" />
        </button>
      </div>
    </header>

    <div class="win__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.win {
  position: relative;
  background: var(--face);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  box-shadow: 4px 4px 0 0 #000;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.win__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 3px 0 4px;
  background: linear-gradient(90deg, var(--navy) 0%, #1a1a9c 70%, #3b3bc4 100%);
  color: #fff;
  user-select: none;
}

.win__icon {
  color: #cfd4ff;
}

.win__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.02em;
}

/* The old ribbed drag-grip filler. Decorative. */
.win__grip {
  flex: 1 1 auto;
  height: 12px;
  min-width: 16px;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.28) 0 1px,
    transparent 1px 3px
  );
  opacity: 0.55;
  margin: 0 4px;
}

.win__sys {
  display: flex;
  gap: 2px;
}

.win__sys .is-close {
  margin-left: 2px;
}

.win__body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

</style>
