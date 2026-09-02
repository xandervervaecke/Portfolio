<script setup lang="ts">
import PixelIcon from '../PixelIcon.vue'
import { site } from '../../data/site'
import { assetUrl, work } from '../../lib/content'
</script>

<template>
  <div class="pane work">
    <header class="work__head">
      <h1 class="t-display work__title">Work history</h1>
      <p class="work__cmd t-mono-xs">
        C:\RESUME\EXPERIENCE.TXT
        <span class="anim-blink">_</span>
      </p>
    </header>

    <div class="work__grid">
      <!-- Timeline ------------------------------------------------------- -->
      <ol class="timeline">
        <li v-for="(job, i) in work" :key="job.id" class="entry">
          <span class="entry__node" :class="{ 'is-first': i === 0 }" />

          <article class="card" :class="{ 'is-latest': i === 0 }">
            <span v-if="i === 0" class="stamp t-mono-xs">Most&nbsp;recent</span>

            <header class="card__head">
              <span v-if="job.image" class="logo bevel-inset">
                <img :src="assetUrl(job.image)" :alt="job.company" loading="lazy" />
              </span>
              <div class="card__id">
                <h3 class="card__role">{{ job.role }}</h3>
                <p class="card__co t-mono-xs">
                  {{ job.company }}
                  <span v-if="job.companyNote" class="dim">({{ job.companyNote }})</span>
                </p>
              </div>
              <span class="period t-mono-xs">{{ job.period }}</span>
            </header>

            <ul class="tasks">
              <li v-for="h in job.highlights" :key="h">
                <span class="tick"><PixelIcon name="check" :size="11" /></span>
                <span>{{ h }}</span>
              </li>
            </ul>

            <div v-if="job.technologies?.length" class="row-wrap card__tech">
              <span v-for="t in job.technologies" :key="t" class="chip">{{ t }}</span>
            </div>
          </article>
        </li>
      </ol>

      <!-- Side card ------------------------------------------------------ -->
      <aside class="filecard">
        <div class="filecard__inner bevel-inset">
          <h3 class="filecard__head t-window">Personnel file</h3>
          <dl class="filecard__specs">
            <dt class="t-mono-xs">Name</dt>
            <dd class="t-mono-xs">{{ site.name }}</dd>
            <dt class="t-mono-xs">Status</dt>
            <dd class="t-mono-xs">PhD researcher, UHasselt</dd>
            <dt class="t-mono-xs">Field</dt>
            <dd class="t-mono-xs">Visual Computing</dd>
            <dt class="t-mono-xs">Based</dt>
            <dd class="t-mono-xs">{{ site.location }}</dd>
          </dl>

          <p class="filecard__note">
            Three placements before the PhD: applied AI in industry and two
            software engineering internships. Full detail lives in the CV.
          </p>

          <div class="filecard__actions">
            <a
              v-for="cv in site.cv"
              :key="cv.src"
              class="w95-btn"
              :href="cv.src"
              target="_blank"
              rel="noopener"
            >
              <PixelIcon name="download" :size="13" />
              {{ cv.label }}
            </a>
          </div>
        </div> 
      </aside>
    </div>
  </div>
</template>

<style scoped>
.work__head {
  margin-bottom: 30px;
}

.work__title {
  margin: 0;
  font-size: clamp(34px, 6vw, 68px);
}

.work__cmd {
  margin: 12px 0 0;
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.work__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 264px;
  gap: 34px;
  align-items: start;
}

/* --- timeline ----------------------------------------------------------- */

.timeline {
  margin: 0;
  padding: 0 0 0 30px;
  list-style: none;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 6px;
  bottom: 6px;
  border-left: 2px dashed var(--outline-variant);
}

.entry {
  position: relative;
  padding-bottom: 26px;
}

.entry:last-child {
  padding-bottom: 0;
}

.entry__node {
  position: absolute;
  left: -30px;
  top: 18px;
  width: 12px;
  height: 12px;
  background: var(--face);
  border: 2px solid var(--navy);
  transition: transform 0.25s var(--ease-snap), background-color 0.25s linear;
}

.entry__node.is-first {
  background: var(--navy);
}

.entry:hover .entry__node {
  transform: scale(1.5) rotate(45deg);
  background: var(--navy);
}

.card {
  position: relative;
  padding: 18px 20px;
  background: var(--paper);
  border: 1px solid var(--outline-variant);
  border-left: 5px solid var(--outline-variant);
  transition:
    transform 0.26s var(--ease-snap),
    box-shadow 0.26s var(--ease-snap),
    border-left-color 0.26s linear;
}

.card:hover {
  transform: translateX(5px);
  border-left-color: var(--navy);
  box-shadow: -4px 4px 0 rgba(0, 0, 0, 0.13);
}

.card.is-latest {
  border-left-color: var(--navy);
}

.stamp {
  position: absolute;
  right: 12px;
  bottom: -11px;
  z-index: 3;
  padding: 3px 10px;
  color: var(--navy);
  background: rgba(224, 224, 255, 0.85);
  border: 2px solid var(--navy);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  transform: rotate(-4deg);
  transition: transform 0.3s var(--ease-snap);
}

.card:hover .stamp {
  transform: rotate(2deg) scale(1.04);
}

.card__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin-bottom: 14px;
}

.logo {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  padding: 4px;
  background: #fff;
  overflow: hidden;
}

.logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s var(--ease-snap);
}

.card:hover .logo img {
  transform: scale(1.08);
}

.card__role {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--ink);
}

.card__co {
  margin: 4px 0 0;
  color: var(--navy);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.dim {
  color: var(--ink-faint);
  text-transform: none;
}

.period {
  padding: 4px 10px;
  background: var(--ink);
  color: #fff;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

.tasks {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.tasks li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  font-size: 15px;
  line-height: 22px;
  color: var(--ink-soft);
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

.card__tech {
  margin-top: 14px;
}

/* --- side card ---------------------------------------------------------- */

.filecard {
  position: relative;
  transform: rotate(1.2deg);
  transition: transform 0.35s var(--ease-snap);
}

.filecard:hover {
  transform: rotate(0deg);
}

.filecard__inner {
  padding: 16px;
  background: var(--paper-dim);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.16);
}

.filecard__head {
  margin: 0 0 12px;
  padding-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-bottom: 1px solid var(--outline);
}

.filecard__specs {
  margin: 0 0 14px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 12px;
}

.filecard__specs dt {
  color: var(--ink-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.filecard__specs dd {
  margin: 0;
  color: var(--ink);
}

.filecard__note {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 21px;
  color: var(--ink-soft);
}

.filecard__actions {
  display: grid;
  gap: 8px;
}

.filecard__tag {
  position: absolute;
  left: -8px;
  bottom: -12px;
  padding: 3px 9px;
  background: var(--legal);
  border: 1px solid #000;
  letter-spacing: 0.12em;
  transform: rotate(-3deg);
}

@media (max-width: 980px) {
  .work__grid {
    grid-template-columns: 1fr;
  }

  .filecard {
    max-width: 320px;
  }
}

@media (max-width: 620px) {
  .card__head {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .period {
    grid-column: 2;
    justify-self: start;
  }
}
</style>
