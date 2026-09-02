<script setup lang="ts">
import { ref } from 'vue'
import PixelIcon from '../PixelIcon.vue'
import { site } from '../../data/site'
import {
  assetUrl,
  education,
  favouriteProjects,
  imageFills,
  imageList,
} from '../../lib/content'
import { useDetail } from '../../composables/useDetail'
import { useDesktop } from '../../composables/useDesktop'
import type { Project } from '../../types'

const { openProject } = useDetail()
const { openTab } = useDesktop()

/**
 * The portrait is set in site.ts. If the file isn't there yet the frame falls
 * back to the "PHOTO.BMP not found" placeholder rather than a broken image.
 */
const portrait = ref<string | null>(site.portrait)

const cover = (p: Project) => assetUrl(p.media?.thumbnail || imageList(p.media)[0] || null)
</script>

<template>
  <div class="pane home">
    <!-- ---------------------------------------------------------------- -->
    <aside class="col-left">
      <div class="portrait-wrap">
        <div class="portrait">
          <img
            v-if="portrait"
            :src="portrait"
            :alt="site.name"
            class="dither"
            @error="portrait = null"
          />
          <div v-else class="portrait__missing">
            <PixelIcon name="person" :size="44" />
            <p class="t-mono-xs">PHOTO.BMP<br />not found</p>
          </div>
        </div>
        <span class="portrait__stamp t-mono-xs">{{ site.role }}</span>
      </div>

      <section class="panel bevel-inset">
        <h3 class="panel__head t-window">Degrees</h3>
        <ul class="panel__list">
          <li v-for="e in education" :key="e.id" class="t-mono-xs">
            <span class="bullet">▪</span>
            <span>
              {{ e.degree }}<template v-if="e.field"> — {{ e.field }}</template>
              <em class="dim"> · {{ e.period }}</em>
            </span>
          </li>
        </ul>
      </section>

      <section class="panel bevel-inset">
        <h3 class="panel__head t-window">Tech Stack</h3>
        <ul class="panel__grid">
          <li v-for="t in site.stack" :key="t" class="t-mono-xs">
            <span class="sq" />{{ t }}
          </li>
        </ul>
      </section>

      <section class="panel bevel-inset">
        <h3 class="panel__head t-window">Contact</h3>
        <ul class="panel__list contact">
          <li>
            <PixelIcon name="mail" :size="14" />
            <a class="a-wavy t-mono-xs" :href="`mailto:${site.contact.email}`">
              {{ site.contact.email }}
            </a>
          </li>
          <li>
            <PixelIcon name="link" :size="14" />
            <a
              class="a-wavy t-mono-xs"
              :href="site.contact.linkedin"
              target="_blank"
              rel="noopener"
            >
              {{ site.contact.linkedinLabel }}
            </a>
          </li>
          <li>
            <PixelIcon name="person" :size="14" />
            <span class="t-mono-xs">{{ site.location }}</span>
          </li>
        </ul>
      </section>
    </aside>

    <!-- ---------------------------------------------------------------- -->
    <div class="col-right">
      <h1 class="t-display headline">
        Who am I<span class="q">?</span>
      </h1>

      <p class="whoami">
        I'm <span class="whoami__name">{{ site.name }}</span>
      </p>

      <p class="lede">{{ site.lede }}</p>

      <div class="bio">
        <p v-for="(para, i) in site.bio" :key="i">{{ para }}</p>
      </div>

      <!-- Favourites --------------------------------------------------- -->
      <section class="featured">
        <h2 class="sec-head">
          Favourite work
          <span class="sec-head__star"><PixelIcon name="star" :size="15" /></span>
        </h2>

        <ul class="fav-grid">
          <li v-for="p in favouriteProjects" :key="p.id">
            <button type="button" class="fav" @click="openProject(p)">
              <span class="fav__shot bevel-inset" :class="{ 'is-fill': imageFills(p.media) }">
                <img v-if="cover(p)" :src="cover(p)" :alt="p.title" loading="lazy" class="dither" />
                <span v-else class="fav__noimg"><PixelIcon name="folder" :size="26" /></span>
                <span class="fav__star"><PixelIcon name="star" :size="14" /></span>
              </span>
              <span class="fav__title t-window">{{ p.title }}</span>
              <span v-if="p.year" class="fav__year t-mono-xs">{{ p.year }}</span>
            </button>
          </li>
        </ul>

        <button type="button" class="showmore t-mono-xs" @click="openTab('projects')">
          Show all projects <PixelIcon name="arrow" :size="13" />
        </button>
      </section>

      <!-- CV ----------------------------------------------------------- -->
      <div class="cv-row">
        <a
          v-for="cv in site.cv"
          :key="cv.src"
          class="w95-btn"
          :href="cv.src"
          target="_blank"
          rel="noopener"
        >
          <PixelIcon name="download" :size="14" />
          {{ cv.label }}
        </a>
        <a class="w95-btn" :href="`mailto:${site.contact.email}`">
          <PixelIcon name="mail" :size="14" />
          Get in touch
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 40px;
  align-items: start;
}

/* --- left column -------------------------------------------------------- */

.col-left {
  display: grid;
  gap: 22px;
  position: sticky;
  top: 0;
}

.portrait-wrap {
  position: relative;
  padding-bottom: 10px;
}

.portrait {
  position: relative;
  aspect-ratio: 4 / 5;
  background: #fff;
  border: 4px solid var(--ink);
  padding: 8px;
  transform: rotate(-2deg);
  transition: transform 0.35s var(--ease-snap), box-shadow 0.35s var(--ease-snap);
  box-shadow: 5px 5px 0 rgba(0, 0, 0, 0.25);
}

.portrait:hover {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: 8px 10px 0 rgba(0, 0, 0, 0.22);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border: 2px solid var(--outline-variant);
}

.portrait__missing {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 10px;
  text-align: center;
  color: var(--ink-faint);
  border: 2px dashed var(--outline-variant);
  background: repeating-linear-gradient(45deg, #f6f6f6 0 9px, #ededed 9px 18px);
}

.portrait__missing p {
  margin: 0;
  line-height: 15px;
}

.portrait__stamp {
  position: absolute;
  right: 6px;
  bottom: 0;
  padding: 4px 10px;
  background: var(--navy);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 2px solid #000;
  transform: rotate(5deg);
  transition: transform 0.3s var(--ease-snap);
}

.portrait-wrap:hover .portrait__stamp {
  transform: rotate(-2deg) scale(1.04);
}

.panel {
  padding: 14px 16px;
  background: var(--paper-dim);
}

.panel__head {
  margin: 0 0 10px;
  padding-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-bottom: 1px solid var(--outline);
}

.panel__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.panel__list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
  line-height: 16px;
}

.bullet {
  color: var(--navy);
}

.dim {
  color: var(--ink-faint);
  font-style: normal;
}

.panel__grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px 10px;
}

.panel__grid li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sq {
  width: 7px;
  height: 7px;
  background: var(--navy);
  flex: 0 0 auto;
}

.contact li {
  align-items: center;
  color: var(--ink-soft);
}

/* --- right column ------------------------------------------------------- */

.headline {
  margin: 0;
  font-size: clamp(46px, 8.5vw, 96px);
  color: var(--ink);
}

.headline .q {
  color: var(--navy);
}

.whoami {
  margin: 10px 0 22px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(20px, 2.6vw, 30px);
  color: var(--ink-soft);
}

.whoami__name {
  color: var(--ink);
  border-bottom: 5px solid var(--navy);
  padding-bottom: 2px;
}

.lede {
  margin: 0 0 20px;
  padding: 16px 18px;
  background: var(--navy-soft);
  border-left: 4px solid var(--navy);
  font-size: 17px;
  line-height: 26px;
}

.bio {
  position: relative;
  max-width: 68ch;
}

.bio p {
  margin: 0 0 14px;
  color: var(--ink-soft);
}

/* --- favourites --------------------------------------------------------- */

.featured {
  margin-top: 40px;
}

.sec-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sec-head__star {
  color: #ffcf33;
}

.fav-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.fav {
  width: 100%;
  display: grid;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  text-align: left;
  background: var(--face);
  border: 2px solid;
  border-top-color: var(--hi);
  border-left-color: var(--hi);
  border-right-color: var(--lo);
  border-bottom-color: var(--lo);
  transition: transform 0.22s var(--ease-snap), box-shadow 0.22s var(--ease-snap);
}

.fav:hover {
  transform: translate(-2px, -3px);
  box-shadow: 4px 5px 0 rgba(0, 0, 0, 0.3);
}

.fav:active {
  transform: translate(0, 0);
  box-shadow: none;
  border-top-color: var(--lo);
  border-left-color: var(--lo);
  border-right-color: var(--hi);
  border-bottom-color: var(--hi);
}

.fav__shot {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: var(--paper-dim);
}

.fav__shot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s var(--ease-snap);
}

.fav:hover .fav__shot img {
  transform: scale(1.07);
}

/* imagefill: show the whole image rather than cropping it to the tile */
.fav__shot.is-fill img {
  object-fit: contain;
}

.fav__noimg {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--ink-faint);
}

.fav__star {
  position: absolute;
  top: 3px;
  right: 3px;
  color: #ffcf33;
  filter: drop-shadow(1px 1px 0 rgba(0, 0, 0, 0.5));
}

.fav:hover .fav__star {
  animation: twinkle 0.7s var(--ease-snap);
}

.fav__title {
  color: var(--ink);
  line-height: 15px;
}

.fav__year {
  color: var(--ink-faint);
}

.showmore {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  background: none;
  border: 0;
  cursor: pointer;
  color: var(--navy);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: gap 0.2s var(--ease-snap);
}

.showmore:hover {
  gap: 14px;
  text-decoration: underline;
}

/* --- cv row ------------------------------------------------------------- */

.cv-row {
  margin-top: 40px;
  padding-top: 24px;
  border-top: 2px dashed var(--outline-variant);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 900px) {
  .home {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .col-left {
    position: static;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .portrait-wrap {
    max-width: 260px;
  }
}

/* --- phone ---------------------------------------------------------------
 * The desktop two-column layout is left alone; this only rearranges the single
 * column it collapses into. Stacked in source order the whole sidebar —
 * portrait, degrees, stack, contact — came before the headline, so you scrolled
 * three screens of supporting detail before reaching the introduction.
 *
 * `display: contents` drops both columns out of the layout so their children
 * become grid items of .home directly, which is what makes them orderable
 * independently. It does not change the DOM, so every selector below still
 * reads the same as it does on desktop.
 * ---------------------------------------------------------------------- */

@media (max-width: 560px) {
  .home {
    gap: 22px;
  }

  .col-left,
  .col-right {
    display: contents;
  }

  .headline {
    order: 1;
  }

  .whoami {
    order: 2;
    margin: 4px 0 0;
  }

  .portrait-wrap {
    order: 3;
    max-width: 200px;
  }

  .lede {
    order: 4;
  }

  .bio {
    order: 5;
  }

  /* Degrees, tech stack and contact keep their own source order within this. */
  .col-left .panel {
    order: 6;
  }

  .featured {
    order: 7;
    margin-top: 6px;
  }

  .cv-row {
    order: 8;
    margin-top: 6px;
    padding-top: 18px;
  }

  /* One card per row turned four projects into four screens. */
  .fav-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .fav__title {
    font-size: 12px;
    line-height: 15px;
  }

  /* Full-width buttons stack more predictably than a wrapping row. */
  .cv-row .w95-btn {
    flex: 1 1 100%;
    justify-content: center;
  }
}
</style>
