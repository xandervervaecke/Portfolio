<script setup lang="ts">
/**
 * Hand-rolled 16x16 icons. Pixel-snapped on purpose — no smooth icon fonts,
 * per the design spec ("Pixelated Icons ... never smooth SVGs").
 *
 * `school` is the deliberate exception: a supplied SVG, inlined below.
 */
const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), {
  size: 16,
})

// Each entry is a list of solid rects: [x, y, w, h] on a 16x16 grid.
const RECTS: Record<string, number[][]> = {
  minimize: [[3, 11, 10, 2]],
  maximize: [[2, 2, 12, 2], [2, 4, 2, 10], [12, 4, 2, 10], [2, 12, 12, 2]],
  restore: [
    [5, 2, 9, 2], [12, 4, 2, 5], [5, 4, 2, 2],
    [2, 6, 9, 2], [2, 8, 2, 6], [9, 8, 2, 6], [2, 12, 9, 2],
  ],
  start: [[2, 2, 5, 5], [9, 2, 5, 5], [2, 9, 5, 5], [9, 9, 5, 5]],
  person: [[6, 2, 4, 4], [4, 8, 8, 2], [3, 10, 10, 4]],
  folder: [[1, 3, 6, 2], [1, 5, 14, 9]],
  work: [[6, 2, 4, 1], [6, 3, 1, 2], [9, 3, 1, 2], [1, 5, 14, 9]],
  terminal: [[1, 2, 14, 12]],
  download: [[7, 1, 2, 6], [3, 7, 10, 2], [5, 9, 6, 2], [7, 11, 2, 2], [2, 14, 12, 2]],
  mail: [[1, 3, 14, 10]],
  /*
   * Two open rectangles facing each other, joined by a bar — a chain link.
   * The previous version was three rects all on row 7, which merged into a
   * single dash and read as nothing at all.
   */
  link: [
    [2, 5, 5, 2], [2, 9, 5, 2], [2, 7, 2, 2],
    [9, 5, 5, 2], [9, 9, 5, 2], [12, 7, 2, 2],
    [6, 7, 4, 2],
  ],
  search: [[4, 2, 6, 2], [2, 4, 2, 6], [10, 4, 2, 6], [4, 10, 6, 2], [11, 11, 3, 3]],
  filter: [[2, 3, 12, 2], [4, 6, 8, 2], [6, 9, 4, 2], [7, 12, 2, 2]],
  play: [[5, 3, 2, 10], [7, 5, 2, 6], [9, 7, 2, 2]],
  pdf: [[3, 1, 8, 2], [3, 3, 2, 11], [11, 3, 2, 11], [5, 13, 6, 1], [9, 1, 2, 3], [11, 3, 2, 2]],
  external: [[8, 2, 6, 2], [12, 4, 2, 4], [2, 5, 2, 9], [4, 12, 9, 2], [8, 6, 2, 2], [6, 8, 2, 2]],
  // A solid head rather than a sparse chevron: at 12-13px the old one broke up
  // into unrelated blocks instead of reading as an arrow.
  arrow: [[2, 7, 7, 2], [9, 5, 2, 6], [11, 6, 1, 4], [12, 7, 1, 2]],
  check: [[2, 7, 2, 2], [4, 9, 2, 2], [6, 11, 2, 2], [8, 8, 2, 3], [10, 5, 2, 3], [12, 3, 2, 2]],
  volume: [[2, 6, 3, 4], [5, 4, 2, 8], [8, 5, 2, 6], [11, 3, 2, 10]],
  disk: [[1, 1, 14, 14]],
  chevron: [[3, 5, 2, 2], [5, 7, 2, 2], [7, 9, 2, 2], [9, 7, 2, 2], [11, 5, 2, 2]],
}

const rects = () => RECTS[props.name] ?? []
</script>

<template>
  <svg
    class="pixel-icon"
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="name === 'close'">
      <path
        d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="square"
        shape-rendering="geometricPrecision"
      />
    </template>
    <!--
      The one icon that is not hand-drawn on the 16x16 grid: supplied as
      images/education-svgrepo-com.svg and inlined here so it inherits
      currentColor and needs no network request.

      Authored on a 110x135 viewBox whose artwork sits in roughly x 0-100,
      y 20-71 — the rest of that box is the attribution text, which is dropped
      here (see the note in sceneConfig-adjacent docs) and would render as
      unreadable specks at 16px. The transform fits that artwork box to this
      grid and centres it.
    -->
    <template v-else-if="name === 'school'">
      <g transform="translate(0 0.72) scale(0.16)" fill="currentColor">
        <path
          fill-rule="evenodd"
          d="m50.496 20.832 48.508 16.668c1.3672 0.49609 1.3672 2.4883 0 2.9844l-7.8359 2.6133v8.957c0.74609 0.375 1.3672 1.1211 1.3672 1.9883v3.3594c0 0.74609-0.375 1.3672-0.99609 1.7422l1.7422 3.7305c-2.1133 1.1211-5.0977 1.1211-7.2148 0l1.6172-3.7305c-0.49609-0.375-0.87109-0.99609-0.87109-1.7422v-3.3594c0-0.87109 0.49609-1.6172 1.2422-1.9883v-7.8359l-37.562 12.934c-0.375 0.125-0.62109 0.125-0.99609 0l-48.508-16.668c-1.3672-0.49609-1.3672-2.4883 0-2.9844l48.508-16.668c0.375-0.125 0.62109-0.125 0.99609 0zm28.234 29.727v20.023c-19.152 11.566-38.309 11.566-57.461 0v-20.023l27.238 9.3281c0.99609 0.375 1.9883 0.375 2.9844 0z"
        />
      </g>
    </template>
    <template v-else-if="name === 'terminal'">
      <rect x="1" y="2" width="14" height="12" fill="none" stroke="currentColor" stroke-width="2" />
      <rect x="4" y="6" width="2" height="2" fill="currentColor" />
      <rect x="6" y="8" width="2" height="2" fill="currentColor" />
      <rect x="4" y="10" width="2" height="2" fill="currentColor" />
      <rect x="9" y="10" width="4" height="2" fill="currentColor" />
    </template>
    <template v-else-if="name === 'mail'">
      <rect x="1" y="3" width="14" height="10" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M2 4 L8 9 L14 4" fill="none" stroke="currentColor" stroke-width="2" />
    </template>
    <template v-else-if="name === 'folder'">
      <path
        d="M1 4 L1 13 L15 13 L15 5 L7 5 L6 3 L1 3 Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1"
      />
    </template>
    <template v-else-if="name === 'disk'">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" />
      <rect x="5" y="1" width="6" height="5" fill="currentColor" />
      <rect x="4" y="9" width="8" height="6" fill="currentColor" />
    </template>
    <template v-else-if="name === 'star'">
      <path
        d="M8 1 L10 6 L15 6 L11 9 L12.5 14.5 L8 11.5 L3.5 14.5 L5 9 L1 6 L6 6 Z"
        fill="currentColor"
        stroke="#000"
        stroke-width="1"
        stroke-linejoin="miter"
      />
    </template>
    <template v-else>
      <rect
        v-for="(r, i) in rects()"
        :key="i"
        :x="r[0]"
        :y="r[1]"
        :width="r[2]"
        :height="r[3]"
        fill="currentColor"
      />
    </template>
  </svg>
</template>

<style scoped>
.pixel-icon {
  display: block;
  flex: 0 0 auto;
  shape-rendering: crispEdges;
}
</style>
