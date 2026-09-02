<script setup lang="ts">
import { computed } from 'vue'
import PixelIcon from './PixelIcon.vue'
import {
  assetUrl,
  EXTRACURRICULAR_TAG,
  imageFills,
  imageList,
  projectTags,
  youtubeId,
} from '../lib/content'
import type { Project } from '../types'

const props = defineProps<{ project: Project; index?: number }>()

defineEmits<{ open: [Project] }>()

const cover = computed(() => {
  const media = props.project.media
  return assetUrl(media?.thumbnail || imageList(media)[0] || null)
})

const tags = computed(() => projectTags(props.project))
const fills = computed(() => imageFills(props.project.media))
const hasVideo = computed(() => !!youtubeId(props.project.media?.video))
const shots = computed(() => imageList(props.project.media).length)

/** A deterministic wobble so the wall of photos never looks CSS-perfect. */
const tilt = computed(() => {
  const seq = [-2.1, 1.6, -1.2, 2.3, -1.8, 1.1]
  return seq[(props.index ?? 0) % seq.length]
})
</script>

<template>
  <article
    class="card polaroid"
    :class="{ 'is-placeholder': project.isPlaceholder }"
    :style="{ '--tilt': `${tilt}deg` }"
  >
    <button class="card__hit" type="button" @click="$emit('open', project)">
      <span class="sr-only">Open {{ project.title }}</span>
    </button>

    <span class="tape card__tape" />

    <span v-if="project.favorite" class="star" title="Favourite">
      <PixelIcon name="star" :size="18" />
    </span>

    <div class="card__shot bevel-inset" :class="{ 'is-fill': fills }">
      <img v-if="cover" :src="cover" :alt="project.title" loading="lazy" class="dither" />
      <div v-else class="card__noimg">
        <PixelIcon name="folder" :size="34" />
        <span class="t-mono-xs">{{ project.isPlaceholder ? '*.*' : 'NO_PREVIEW.BMP' }}</span>
      </div>

      <span v-if="hasVideo" class="badge badge--vid t-mono-xs">
        <PixelIcon name="play" :size="10" /> VIDEO
      </span>
      <span v-if="shots > 1" class="badge badge--count t-mono-xs">{{ shots }} IMG</span>
    </div>

    <div class="card__meta">
      <h3 class="card__title">{{ project.title }}</h3>
      <span v-if="project.year" class="card__year t-mono-xs">{{ project.year }}</span>
    </div>

    <p v-if="project.subtitle" class="card__sub t-mono-xs">{{ project.subtitle }}</p>

    <div class="row-wrap card__tags">
      <span
        v-for="tag in tags"
        :key="tag"
        class="chip"
        :class="{ 'is-extra': tag === EXTRACURRICULAR_TAG }"
      >
        {{ tag }}
      </span>
    </div>

    <p class="card__summary">{{ project.summary }}</p>

    <span class="card__open t-mono-xs">
      OPEN <PixelIcon name="arrow" :size="12" />
    </span>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  transform: rotate(var(--tilt));
  cursor: pointer;
}

.card:hover,
.card:focus-within {
  transform: rotate(0deg) translateY(-6px) scale(1.012);
}

.card__hit {
  position: absolute;
  inset: 0;
  z-index: 6;
  background: none;
  border: 0;
  cursor: pointer;
}

.card__hit:focus-visible {
  outline: 2px dashed var(--navy);
  outline-offset: 3px;
}

.card__tape {
  top: -11px;
  left: 50%;
  width: 62px;
  height: 20px;
  transform: translateX(-50%) rotate(-3deg);
}

.card:hover .card__tape {
  transform: translateX(-50%) rotate(2deg) translateY(-2px);
}

.star {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 8;
  color: #ffcf33;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.4));
}

.card:hover .star {
  animation: twinkle 0.7s var(--ease-snap);
}

.card__shot {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--paper-dim);
  margin-bottom: 12px;
}

.card__shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.55s var(--ease-snap), filter 0.35s linear;
}

.card:hover .card__shot img {
  transform: scale(1.06);
  filter: none;
}

.card__noimg {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: var(--ink-faint);
  background:
    repeating-linear-gradient(45deg, #f2f2f2 0 8px, #e9e9e9 8px 16px);
}

.badge {
  position: absolute;
  bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 5px;
  background: rgba(0, 0, 40, 0.82);
  color: #dfe2ff;
  letter-spacing: 0.08em;
}

.badge--vid {
  left: 6px;
}

.badge--count {
  right: 6px;
}

.card__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.card__title {
  margin: 0;
  font-family: var(--font-body);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--navy);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: var(--outline-variant);
  text-underline-offset: 4px;
  transition: text-decoration-color 0.25s linear;
}

.card:hover .card__title {
  text-decoration-color: var(--navy);
}

.card__year {
  flex: 0 0 auto;
  color: var(--ink-faint);
  letter-spacing: 0.1em;
}

.card__sub {
  margin: 3px 0 0;
  color: var(--ink-soft);
}

.card__tags {
  margin: 10px 0 8px;
}

.card__summary {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 17px;
  color: var(--ink-soft);
}

.card__open {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--navy);
  letter-spacing: 0.14em;
  opacity: 0;
  transform: translateX(-6px);
  transition: all 0.25s var(--ease-snap);
}

.card:hover .card__open {
  opacity: 1;
  transform: translateX(0);
}

/* imagefill: the frame takes the image's own shape instead of cropping to 4:3 */
.card__shot.is-fill {
  aspect-ratio: auto;
}

.card__shot.is-fill img {
  height: auto;
  object-fit: fill;
}

.is-placeholder .card__shot {
  aspect-ratio: 16 / 7;
}
</style>
