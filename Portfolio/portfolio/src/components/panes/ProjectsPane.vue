<script setup lang="ts">
import { computed, ref } from 'vue'
import PixelIcon from '../PixelIcon.vue'
import ProjectCard from '../ProjectCard.vue'
import { allProjectTags, EXTRACURRICULAR_TAG, projects, projectTags } from '../../lib/content'
import { useDetail } from '../../composables/useDetail'
import type { Project } from '../../types'

const { openProject } = useDetail()

const query = ref('')
const activeTags = ref<string[]>([])
const favesOnly = ref(false)

/** The tag list is long; show the most-used ones and hide the tail. */
const TAG_PREVIEW = 12
const showAllTags = ref(false)

const shownTags = computed(() => {
  if (showAllTags.value) return allProjectTags
  return [...new Set([...allProjectTags.slice(0, TAG_PREVIEW), ...activeTags.value])]
})

const hiddenTagCount = computed(() => allProjectTags.length - TAG_PREVIEW)

function toggleTag(tag: string) {
  const i = activeTags.value.indexOf(tag)
  if (i === -1) activeTags.value.push(tag)
  else activeTags.value.splice(i, 1)
}

function reset() {
  query.value = ''
  activeTags.value = []
  favesOnly.value = false
}

const hasFilters = computed(
  () => !!query.value || activeTags.value.length > 0 || favesOnly.value,
)

function matchesQuery(p: Project, q: string): boolean {
  const haystack = [
    p.title,
    p.subtitle ?? '',
    p.summary ?? '',
    p.description ?? '',
    ...(p.technologies ?? []),
    ...projectTags(p),
    String(p.year ?? ''),
  ]
    .join(' ')
    .toLowerCase()
  return q.split(/\s+/).every((word) => haystack.includes(word))
}

/** Already favourites-first / newest-first from the data layer. */
const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return projects.filter((p) => {
    if (favesOnly.value && !p.favorite) return false
    if (activeTags.value.length) {
      const tags = projectTags(p)
      if (!activeTags.value.every((t) => tags.includes(t))) return false
    }
    if (q && !matchesQuery(p, q)) return false
    return true
  })
})
</script>

<template>
  <div class="pane projects">
    <!-- Filter console ------------------------------------------------- -->
    <div class="console bevel-raised">
      <div class="console__row">
        <label class="field">
          <span class="field__label t-window">Search file(s):</span>
          <span class="field__input">
            <PixelIcon name="search" :size="13" />
            <input v-model="query" class="w95-field" type="text" placeholder="*.proj" />
          </span>
        </label>

        <label class="w95-check">
          <input v-model="favesOnly" type="checkbox" />
          <span class="box"><PixelIcon name="check" :size="10" /></span>
          <span>Favourites only</span>
        </label>

        <button class="w95-btn" type="button" :disabled="!hasFilters" @click="reset">
          <PixelIcon name="filter" :size="13" />
          Reset
        </button>
      </div>

      <div class="console__row console__row--tags">
        <span class="field__label t-window">Type:</span>
        <div class="row-wrap">
          <button
            v-for="tag in shownTags"
            :key="tag"
            type="button"
            class="chip"
            :class="{
              'is-active': activeTags.includes(tag),
              'is-extra': tag === EXTRACURRICULAR_TAG,
            }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>

          <button
            v-if="hiddenTagCount > 0"
            type="button"
            class="tag-toggle t-mono-xs"
            @click="showAllTags = !showAllTags"
          >
            {{ showAllTags ? '− fewer tags' : `+ ${hiddenTagCount} more tags` }}
          </button>
        </div>
      </div>
    </div>

    <hr class="rule-dashed" />

    <!-- Gallery --------------------------------------------------------- -->
    <div class="gallery-wrap">
      <span class="watermark t-display" aria-hidden="true">WORK</span>

      <transition-group name="cards" tag="ul" class="gallery">
        <li v-for="(p, i) in visible" :key="p.id" class="gallery__cell">
          <ProjectCard :project="p" :index="i" @open="openProject" />
        </li>
      </transition-group>

      <div v-if="!visible.length" class="empty bevel-inset">
        <PixelIcon name="search" :size="34" />
        <p class="t-window">No files match that filter.</p>
        <p class="t-mono-xs">Try clearing the search box or deselecting a tag.</p>
        <button class="w95-btn" type="button" @click="reset">Reset filters</button>
      </div>
    </div>

    <!-- Status bar ------------------------------------------------------ -->
    <footer class="statusbar">
      <span class="statusbar__cell bevel-pressed t-mono-xs">
        {{ visible.length }} object(s)
      </span>
      <span class="statusbar__cell bevel-pressed t-mono-xs">
        sorted: favourites first, then newest
      </span>
      <span class="statusbar__cell statusbar__cell--grow bevel-pressed t-mono-xs">
        {{ hasFilters ? 'filter active' : 'showing everything' }}
      </span>
    </footer>
  </div>
</template>

<style scoped>
.projects {
  display: flex;
  flex-direction: column;
}

/* --- console ------------------------------------------------------------ */

.console {
  padding: 14px 16px;
  display: grid;
  gap: 14px;
}

.console__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
}

.console__row--tags {
  align-items: baseline;
}

.field {
  flex: 1 1 260px;
  display: grid;
  gap: 5px;
}

.field__label {
  text-transform: none;
  color: var(--ink);
}

.field__input {
  position: relative;
  display: flex;
  align-items: center;
}

.field__input > svg {
  position: absolute;
  left: 8px;
  color: var(--ink-faint);
  pointer-events: none;
}

.field__input input {
  width: 100%;
  padding-left: 27px;
}

.tag-toggle {
  padding: 1px 6px;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--navy);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: transform 0.14s var(--ease-snap);
}

.tag-toggle:hover {
  transform: translateY(-2px);
}

.w95-btn:disabled {
  color: var(--lo);
  text-shadow: 1px 1px 0 var(--hi);
  cursor: default;
  transform: none;
  box-shadow: none;
}

/* --- gallery ------------------------------------------------------------ */

.gallery-wrap {
  position: relative;
  flex: 1 1 auto;
}

.watermark {
  position: absolute;
  top: 22%;
  left: 50%;
  transform: translateX(-50%) rotate(-11deg);
  font-size: clamp(90px, 16vw, 210px);
  color: var(--navy);
  opacity: 0.06;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.gallery {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 6px 0 8px;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(288px, 1fr));
  gap: 34px 26px;
}

.gallery__cell {
  min-width: 0;
}

/* every other card sits a little lower, like a taped-up collage */
.gallery__cell:nth-child(even) {
  margin-top: 22px;
}

.cards-enter-active,
.cards-leave-active {
  transition: opacity 0.22s linear, transform 0.28s var(--ease-snap);
}

.cards-enter-from,
.cards-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(10px);
}

.cards-leave-active {
  position: absolute;
}

.cards-move {
  transition: transform 0.32s var(--ease-snap);
}

.empty {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 56px 24px;
  text-align: center;
  color: var(--ink-faint);
  background: repeating-linear-gradient(45deg, #f6f6f6 0 9px, #efefef 9px 18px);
}

.empty p {
  margin: 0;
}

/* --- status bar --------------------------------------------------------- */

.statusbar {
  margin-top: 26px;
  display: flex;
  gap: 4px;
  padding-top: 4px;
}

.statusbar__cell {
  padding: 4px 10px;
  color: var(--ink-soft);
  background: var(--face);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.statusbar__cell--grow {
  flex: 1 1 auto;
}

@media (max-width: 620px) {
  .statusbar__cell:nth-child(2) {
    display: none;
  }

  .gallery__cell:nth-child(even) {
    margin-top: 0;
  }
}
</style>
