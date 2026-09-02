<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Win95Window from './Win95Window.vue'
import PixelIcon from './PixelIcon.vue'
import YouTubeEmbed from './YouTubeEmbed.vue'
import { assetUrl, EXTRACURRICULAR_TAG, imageFills, imageList, pdfList } from '../lib/content'
import { useDetail } from '../composables/useDetail'

const { doc, closeDetail } = useDetail()

const shotIndex = ref(0)
const panel = ref<HTMLElement | null>(null)
let lastFocus: HTMLElement | null = null

const shots = computed(() => imageList(doc.value?.media).map(assetUrl))
const fills = computed(() => imageFills(doc.value?.media))
const pdfs = computed(() => pdfList(doc.value?.media))
const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

watch(doc, async (next) => {
  shotIndex.value = 0
  if (next) {
    lastFocus = document.activeElement as HTMLElement
    await nextTick()
    panel.value?.focus()
  } else {
    lastFocus?.focus?.()
  }
})

function onKey(e: KeyboardEvent) {
  if (!doc.value) return
  if (e.key === 'Escape') {
    e.stopPropagation()
    closeDetail()
  }
  if (shots.value.length > 1) {
    if (e.key === 'ArrowRight') shotIndex.value = (shotIndex.value + 1) % shots.value.length
    if (e.key === 'ArrowLeft')
      shotIndex.value = (shotIndex.value - 1 + shots.value.length) % shots.value.length
  }
}

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <transition name="dlg">
    <div v-if="doc" class="dlg-layer" @click.self="closeDetail()">
      <div
        ref="panel"
        class="dlg"
        role="dialog"
        aria-modal="true"
        :aria-label="doc.title"
        tabindex="-1"
      >
        <Win95Window
          :title="`C:\\PORTFOLIO\\${doc.id.toUpperCase().replace(/-/g, '_')}.DOC`"
          icon="disk"
          @close="closeDetail()"
        >
          <div class="dlg__scroll w95-scroll">
            <!-- Header block -->
            <header class="dlg__head">
              <span class="kicker t-mono-xs">
                {{ doc.kicker }}
                <template v-if="doc.year"> · {{ doc.year }}</template>
              </span>
              <h2 class="dlg__title t-headline">
                {{ doc.title }}
                <span v-if="doc.favorite" class="dlg__star"><PixelIcon name="star" :size="20" /></span>
              </h2>
              <p v-if="doc.subtitle" class="dlg__sub">{{ doc.subtitle }}</p>

              <p v-if="doc.award" class="award sticky-note">★ {{ doc.award }}</p>

              <div v-if="doc.tags.length" class="row-wrap dlg__tags">
                <span
                  v-for="tag in doc.tags"
                  :key="tag"
                  class="chip"
                  :class="{ 'is-extra': tag === EXTRACURRICULAR_TAG }"
                >
                  {{ tag }}
                </span>
              </div>
            </header>

            <div class="dlg__grid">
              <!-- Media column -->
              <div class="dlg__media">
                <template v-if="shots.length">
                  <figure class="shot bevel-inset" :class="{ 'is-fill': fills }">
                    <img :src="shots[shotIndex]" :alt="doc.title" class="dither" />
                  </figure>
                  <div v-if="shots.length > 1" class="thumbs">
                    <button
                      v-for="(s, i) in shots"
                      :key="s"
                      type="button"
                      class="thumb"
                      :class="{ 'is-active': i === shotIndex }"
                      @click="shotIndex = i"
                    >
                      <img :src="s" alt="" loading="lazy" />
                    </button>
                  </div>
                </template>

                <YouTubeEmbed
                  v-if="doc.media?.video"
                  :url="doc.media.video"
                  label="Demo video"
                />

                <div v-if="!shots.length && !doc.media?.video" class="noshot bevel-inset">
                  <PixelIcon name="folder" :size="40" />
                  <p class="t-mono-xs">NO MEDIA ATTACHED</p>
                </div>
              </div>

              <!-- Text column -->
              <div class="dlg__text">
                <p v-if="doc.summary" class="lede">{{ doc.summary }}</p>
                <p v-if="doc.description" class="body">{{ doc.description }}</p>

                <template v-if="doc.highlights.length">
                  <h3 class="mini-head t-window">What's in it</h3>
                  <ul class="checklist">
                    <li v-for="h in doc.highlights" :key="h">
                      <span class="tick"><PixelIcon name="check" :size="11" /></span>
                      <span>{{ h }}</span>
                    </li>
                  </ul>
                </template>

                <template v-if="doc.technologies.length">
                  <h3 class="mini-head t-window">Built with</h3>
                  <div class="row-wrap">
                    <span v-for="t in doc.technologies" :key="t" class="chip">{{ t }}</span>
                  </div>
                </template>

                <dl v-if="doc.meta.length" class="specs">
                  <template v-for="m in doc.meta" :key="m.label">
                    <dt class="t-mono-xs">{{ m.label }}</dt>
                    <dd class="t-mono-xs">{{ m.value }}</dd>
                  </template>
                </dl>

                <div v-if="pdfs.length || doc.links.length" class="actions">
                  <a
                    v-for="p in pdfs"
                    :key="p.src"
                    class="w95-btn"
                    :href="assetUrl(p.src)"
                    target="_blank"
                    rel="noopener"
                  >
                    <PixelIcon name="pdf" :size="14" />
                    {{ p.label }}
                  </a>
                  <a
                    v-for="l in doc.links"
                    :key="l"
                    class="w95-btn"
                    :href="l"
                    target="_blank"
                    rel="noopener"
                  >
                    <PixelIcon name="external" :size="14" />
                    {{ hostname(l) }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Win95Window>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dlg-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 46px 16px 56px;
  background: rgba(6, 10, 24, 0.55);
  backdrop-filter: blur(1.5px);
}

.dlg {
  width: min(1000px, 100%);
  max-height: 100%;
  display: flex;
  outline: none;
}

.dlg > * {
  width: 100%;
}

.dlg__scroll {
  overflow-y: auto;
  background: var(--paper);
  border: 2px solid;
  border-top-color: var(--lo);
  border-left-color: var(--lo);
  border-right-color: var(--hi);
  border-bottom-color: var(--hi);
  margin: 4px;
  padding: 24px;
  max-height: calc(100vh - 130px);
}

.dlg__head {
  border-bottom: 2px dashed var(--outline-variant);
  padding-bottom: 16px;
  margin-bottom: 22px;
}

.kicker {
  display: inline-block;
  padding: 2px 7px;
  background: var(--navy);
  color: #fff;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.dlg__title {
  margin: 12px 0 0;
  font-size: clamp(24px, 3.2vw, 38px);
  color: var(--ink);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.dlg__star {
  color: #ffcf33;
  animation: twinkle 1.4s var(--ease-snap);
}

.dlg__sub {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.award {
  display: inline-block;
  margin: 14px 0 0;
  transform: rotate(-1.2deg);
}

.dlg__tags {
  margin-top: 14px;
}

.dlg__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.dlg__media {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 0;
}

.shot {
  margin: 0;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: var(--paper-dim);
}

.shot img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.shot.is-fill {
  aspect-ratio: auto;
}

.shot.is-fill img {
  height: auto;
  object-fit: fill;
}

.thumbs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.thumb {
  width: 62px;
  height: 46px;
  padding: 2px;
  cursor: pointer;
  background: var(--face);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  transition: transform 0.16s var(--ease-snap);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb:hover {
  transform: translateY(-2px);
}

.thumb.is-active {
  border-top-color: var(--lo);
  border-left-color: var(--lo);
  border-right-color: var(--hi);
  border-bottom-color: var(--hi);
  outline: 2px solid var(--navy);
  outline-offset: -2px;
}

.noshot {
  display: grid;
  place-items: center;
  gap: 10px;
  aspect-ratio: 16 / 9;
  color: var(--ink-faint);
  background: repeating-linear-gradient(45deg, #f4f4f4 0 8px, #ececec 8px 16px);
}

.noshot p {
  margin: 0;
  letter-spacing: 0.1em;
}

.lede {
  margin: 0 0 16px;
  padding: 14px 16px;
  background: var(--navy-soft);
  border-left: 4px solid var(--navy);
  font-size: 16px;
  line-height: 25px;
}

.body {
  margin: 0 0 20px;
  color: var(--ink-soft);
}

.mini-head {
  margin: 22px 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink);
  border-bottom: 1px solid var(--outline-variant);
  padding-bottom: 5px;
}

.checklist {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 9px;
}

.checklist li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  font-size: 15px;
  line-height: 22px;
}

.tick {
  margin-top: 3px;
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  background: var(--paper);
  border: 2px solid;
  border-top-color: var(--lo);
  border-left-color: var(--lo);
  border-right-color: var(--hi);
  border-bottom-color: var(--hi);
  color: var(--navy);
}

.specs {
  margin: 22px 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 14px;
  padding: 12px 14px;
  background: var(--paper-dim);
  border: 1px solid var(--outline-variant);
}

.specs dt {
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.specs dd {
  margin: 0;
  color: var(--ink);
}

.actions {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dlg-enter-active,
.dlg-leave-active {
  transition: opacity 0.18s linear;
}

.dlg-enter-active .dlg {
  animation: zoom-open 0.22s var(--ease-snap);
}

.dlg-leave-active .dlg {
  animation: zoom-close 0.18s var(--ease-snap);
}

.dlg-enter-from,
.dlg-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .dlg__grid {
    grid-template-columns: 1fr;
  }

  .dlg__media {
    position: static;
  }

  .dlg__scroll {
    padding: 16px;
  }
}
</style>
