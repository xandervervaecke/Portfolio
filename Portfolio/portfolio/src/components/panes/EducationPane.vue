<script setup lang="ts">
import PixelIcon from '../PixelIcon.vue'
import {
  assetUrl,
  certifications,
  education,
  imageFills,
  imageList,
  publications,
  youtubeId,
} from '../../lib/content'
import { useDetail } from '../../composables/useDetail'
import type { Publication } from '../../types'

const { openPublication } = useDetail()

const cover = (p: Publication) => assetUrl(imageList(p.media)[0] ?? null)
const hasVideo = (p: Publication) => !!youtubeId(p.media?.video)
</script>

<template>
  <div class="pane edu">
    <header class="edu__head">
      <h1 class="t-display edu__title">
        <span class="hl-marker">Academic</span> background
      </h1>
      <p class="edu__cmd t-mono-xs">
        C:\USER\PROFILE\EDUCATION
        <span class="anim-blink">_</span>
      </p>
    </header>

    <!-- Degrees ---------------------------------------------------------- -->
    <ul class="degrees">
      <li v-for="e in education" :key="e.id">
        <article class="degree" :class="{ 'is-current': e.current }">
          <span class="degree__icon bevel-raised"><PixelIcon name="school" :size="22" /></span>

          <div class="degree__body">
            <h3 class="degree__name">
              {{ e.degree }}<template v-if="e.field"> — {{ e.field }}</template>
            </h3>
            <p class="degree__where t-mono-xs">
              {{ e.institution }}
              <template v-if="e.location"> · {{ e.location }}</template>
            </p>
            <ul v-if="e.highlights?.length" class="degree__notes">
              <li v-for="h in e.highlights" :key="h" class="t-mono-xs">▪ {{ h }}</li>
            </ul>
          </div>

          <span class="degree__period t-mono-xs" :class="{ 'is-now': e.current }">
            <span v-if="e.current" class="live-dot" />
            {{ e.period }}
          </span>
        </article>
      </li>
    </ul>

    <!-- Certifications --------------------------------------------------- -->
    <section v-if="certifications.length" class="certs">
      <h2 class="sec-head">Certifications</h2>
      <ul class="certs__list">
        <li v-for="c in certifications" :key="c.id" class="cert bevel-inset">
          <PixelIcon name="check" :size="14" />
          <span>
            {{ c.title }}
            <template v-if="c.issuer"> — {{ c.issuer }}</template>
            <template v-if="c.year"> ({{ c.year }})</template>
          </span>
        </li>
      </ul>
    </section>

    <div class="rule-torn" />

    <!-- Publications ----------------------------------------------------- -->
    <section class="pubs">
      <h2 class="sec-head">Publications &amp; Papers</h2>

      <ul class="pubs__grid">
        <li v-for="(p, i) in publications" :key="p.id">
          <article class="pub polaroid" :style="{ '--tilt': i % 2 ? '1.4deg' : '-1.6deg' }">
            <button class="pub__hit" type="button" @click="openPublication(p)">
              <span class="sr-only">Open {{ p.title }}</span>
            </button>
            <span class="tape pub__tape" />

            <div class="pub__shot bevel-inset" :class="{ 'is-fill': imageFills(p.media) }">
              <img v-if="cover(p)" :src="cover(p)" :alt="p.title" loading="lazy" class="dither" />
              <div v-else class="pub__noimg"><PixelIcon name="pdf" :size="30" /></div>
              <span class="pub__type t-mono-xs">{{ p.typeLabel }}</span>
              <span v-if="hasVideo(p)" class="pub__vid t-mono-xs">
                <PixelIcon name="play" :size="10" /> VIDEO
              </span>
            </div>

            <div class="pub__meta">
              <h3 class="pub__title">{{ p.title }}</h3>
              <span class="pub__year t-mono-xs">{{ p.year }}</span>
            </div>

            <p v-if="p.venue" class="pub__venue t-mono-xs">{{ p.venue }}</p>

            <p v-if="p.award" class="pub__award sticky-note">★ {{ p.award.title }}</p>

            <div class="row-wrap pub__tags">
              <span v-for="t in p.tags" :key="t" class="chip">{{ t }}</span>
            </div>

            <p class="pub__summary">{{ p.summary }}</p>

            <span class="pub__open t-mono-xs">READ MORE <PixelIcon name="arrow" :size="12" /></span>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.edu {
  /* ruled notebook paper */
  background-image:
    linear-gradient(transparent 27px, rgba(110, 130, 195, 0.26) 27px, rgba(110, 130, 195, 0.26) 28px, transparent 28px);
  background-size: 100% 28px;
  padding-left: 34px;
  position: relative;
}

.edu::before {
  content: '';
  position: absolute;
  top: -24px;
  bottom: -24px;
  left: 16px;
  width: 2px;
  background: rgba(200, 90, 90, 0.4);
}

.edu__head {
  margin-bottom: 28px;
}

.edu__title {
  margin: 0;
  font-size: clamp(34px, 6vw, 68px);
  color: var(--ink);
}

.edu__cmd {
  margin: 12px 0 0;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* --- degrees ------------------------------------------------------------ */

.degrees {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.degree {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px 16px;
  background: var(--paper);
  border: 1px solid var(--outline-variant);
  border-left: 6px solid var(--outline-variant);
  transition:
    transform 0.24s var(--ease-snap),
    border-left-color 0.24s linear,
    box-shadow 0.24s var(--ease-snap);
}

.degree:hover {
  transform: translateX(6px);
  border-left-color: var(--navy);
  box-shadow: -3px 3px 0 rgba(0, 0, 0, 0.14);
}

.degree.is-current {
  border-left-color: var(--navy);
  background: linear-gradient(90deg, var(--navy-soft), var(--paper) 55%);
}

.degree__icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--navy);
}

.degree__name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--navy);
  line-height: 1.25;
}

.degree__where {
  margin: 5px 0 0;
  color: var(--ink-soft);
}

.degree__notes {
  margin: 9px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  color: var(--ink-faint);
}

.degree__period {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  background: var(--face);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  white-space: nowrap;
  letter-spacing: 0.08em;
}

.degree__period.is-now {
  background: var(--navy);
  color: #fff;
  border-color: #000;
}

.live-dot {
  width: 7px;
  height: 7px;
  background: #6fe36f;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(111, 227, 111, 0.3);
  animation: blink 1.6s step-end infinite;
}

/* --- certifications ----------------------------------------------------- */

.certs {
  margin-top: 34px;
}

.certs__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cert {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  transition: transform 0.2s var(--ease-snap);
}

.cert:hover {
  transform: translateY(-3px);
}

.cert svg {
  color: var(--navy);
}

/* --- publications ------------------------------------------------------- */

.pubs__grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 34px 26px;
}

.pub {
  position: relative;
  transform: rotate(var(--tilt));
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.pub:hover,
.pub:focus-within {
  transform: rotate(0deg) translateY(-6px) scale(1.012);
}

.pub__hit {
  position: absolute;
  inset: 0;
  z-index: 6;
  background: none;
  border: 0;
  cursor: pointer;
}

.pub__hit:focus-visible {
  outline: 2px dashed var(--navy);
  outline-offset: 3px;
}

.pub__tape {
  top: -11px;
  left: 50%;
  width: 66px;
  height: 20px;
  transform: translateX(-50%) rotate(2deg);
}

.pub:hover .pub__tape {
  transform: translateX(-50%) rotate(-3deg) translateY(-2px);
}

.pub__shot {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--paper-dim);
  margin-bottom: 12px;
}

.pub__shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.55s var(--ease-snap), filter 0.35s linear;
}

.pub:hover .pub__shot img {
  transform: scale(1.06);
  filter: none;
}

.pub__shot.is-fill {
  aspect-ratio: auto;
}

.pub__shot.is-fill img {
  height: auto;
  object-fit: fill;
}

.pub__noimg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--ink-faint);
}

.pub__type,
.pub__vid {
  position: absolute;
  bottom: 6px;
  padding: 1px 6px;
  background: rgba(0, 0, 40, 0.82);
  color: #dfe2ff;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pub__type {
  left: 6px;
}

.pub__vid {
  right: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pub__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.pub__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--navy);
  text-decoration: underline;
  text-decoration-style: wavy;
  text-decoration-color: var(--outline-variant);
  text-underline-offset: 4px;
  transition: text-decoration-color 0.25s linear;
}

.pub:hover .pub__title {
  text-decoration-color: var(--navy);
}

.pub__year {
  color: var(--ink-faint);
}

.pub__venue {
  margin: 5px 0 0;
  color: var(--ink-soft);
}

.pub__award {
  display: inline-block;
  margin: 10px 0 0;
  transform: rotate(-1.5deg);
  align-self: flex-start;
}

.pub__tags {
  margin: 12px 0 8px;
}

.pub__summary {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 17px;
  color: var(--ink-soft);
}

.pub__open {
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

.pub:hover .pub__open {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 700px) {
  .edu {
    padding-left: 20px;
  }

  .edu::before {
    left: 8px;
  }

  .degree {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .degree__period {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
