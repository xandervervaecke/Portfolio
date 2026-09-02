<script setup lang="ts">
import { computed, ref } from 'vue'
import PixelIcon from './PixelIcon.vue'
import { youtubeId } from '../lib/content'

const props = defineProps<{ url: string; label?: string }>()

const id = computed(() => youtubeId(props.url))
const playing = ref(false)

const poster = computed(() =>
  id.value ? `https://i.ytimg.com/vi/${id.value}/hqdefault.jpg` : '',
)

const embed = computed(() =>
  id.value
    ? `https://www.youtube-nocookie.com/embed/${id.value}?autoplay=1&rel=0&modestbranding=1`
    : '',
)
</script>

<template>
  <figure v-if="id" class="tube">
    <div class="tube__frame bevel-inset">
      <iframe
        v-if="playing"
        class="tube__iframe"
        :src="embed"
        title="YouTube video player"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />
      <button v-else class="tube__poster" type="button" @click="playing = true">
        <img :src="poster" alt="" loading="lazy" class="dither" />
        <span class="tube__scan" />
        <span class="tube__play">
          <PixelIcon name="play" :size="26" />
        </span>
        <span class="tube__cta t-mono-xs">▶ PLAY VIDEO.AVI</span>
      </button>
    </div>
    <figcaption v-if="label" class="tube__cap t-mono-xs">{{ label }}</figcaption>
  </figure>
</template>

<style scoped>
.tube {
  margin: 0;
}

.tube__frame {
  position: relative;
  aspect-ratio: 16 / 9;
  width: 100%;
  background: #000;
  overflow: hidden;
}

.tube__iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.tube__poster {
  position: absolute;
  inset: 0;
  padding: 0;
  border: 0;
  background: #000;
  cursor: pointer;
  display: block;
  overflow: hidden;
}

.tube__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s var(--ease-snap), filter 0.3s linear;
}

.tube__poster:hover img {
  transform: scale(1.05);
  filter: none;
}

.tube__scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.22) 0 1px,
    transparent 1px 3px
  );
  box-shadow: inset 0 0 70px rgba(0, 0, 0, 0.7);
}

.tube__play {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 62px;
  height: 48px;
  display: grid;
  place-items: center;
  color: #000;
  background: var(--face);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  transition: transform 0.18s var(--ease-snap), background-color 0.18s linear;
}

.tube__poster:hover .tube__play {
  transform: translate(-50%, -50%) scale(1.1);
  background: var(--face-light);
}

.tube__poster:active .tube__play {
  border-top-color: var(--lo);
  border-left-color: var(--lo);
  border-right-color: var(--hi);
  border-bottom-color: var(--hi);
}

.tube__cta {
  position: absolute;
  left: 8px;
  bottom: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 40, 0.8);
  color: #d8dcff;
  letter-spacing: 0.08em;
}

.tube__cap {
  margin-top: 6px;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
