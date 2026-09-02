<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted } from 'vue'
import PixelIcon from './PixelIcon.vue'
import { site } from '../data/site'
import { useDesktop } from '../composables/useDesktop'
import { useHeroBoot } from '../composables/useHeroBoot'
import { sceneConfig } from '../three/sceneConfig'
import { asset } from '../lib/asset'

/* CSS url() is never rewritten for the deploy base, so the veil's backdrop
 * comes in as a custom property instead. */
const veilImage = `url('${asset('/images/background.jpg')}')`

// three.js is ~600 kB; keep it out of the main bundle.
const HeroScene = defineAsyncComponent(() => import('./HeroScene.vue'))

const { desktopOpen } = useDesktop()
const { booting, requestBoot, sceneProgress, sceneReady } = useHeroBoot()


/* --- "scroll or click to boot" -------------------------------------------
 * The hero owns the viewport while it is up, so there is nothing to scroll;
 * any downward gesture is read as "let me in". That no longer opens the
 * desktop on the spot — it hands over to the 3D scene, which plays its exit
 * animation and opens the desktop when the character is done.
 * ---------------------------------------------------------------------- */

let touchStartY = 0

/** True while you are hunting for a camera position: the wheel zooms instead. */
const cameraDebug = sceneConfig.debug.camera

/** Any gesture is ignored once the desktop is up or the sequence is running. */
function busy() {
  return desktopOpen.value || booting.value || !sceneReady.value
}

function onWheel(e: WheelEvent) {
  if (busy() || cameraDebug) return
  if (e.deltaY > 6) requestBoot()
}

function onKey(e: KeyboardEvent) {
  if (busy()) return
  if (['ArrowDown', 'PageDown', 'Enter', ' ', 'Spacebar'].includes(e.key)) {
    e.preventDefault()
    requestBoot()
  }
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0
}

function onTouchMove(e: TouchEvent) {
  if (busy() || cameraDebug) return
  const y = e.touches[0]?.clientY ?? 0
  if (touchStartY - y > 40) requestBoot()
}

onMounted(() => {
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('keydown', onKey)
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchmove', onTouchMove)
})
</script>

<template>
  <section
    class="hero"
    :class="{ 'is-behind': desktopOpen, 'is-booting': booting, 'is-loading': !sceneReady }"
  >
    <div class="hero-bg" />
    <div class="hero-frame">
      <HeroScene :paused="desktopOpen" />
      <div class="hero-vignette" />
    </div>
    <div class="hero-veil" :style="{ '--veil-image': veilImage }" />

    <!-- Covers everything until the scene has finished loading. Deliberately
         plain: no photo, nothing to load before it can show. -->
    <div v-if="!sceneReady" class="loader">
      <p class="loader__label t-mono-xs">LOADING_OFFICE</p>
      <div class="loader__track">
        <div class="loader__fill" :style="{ width: Math.round(sceneProgress * 100) + '%' }" />
      </div>
      <p class="loader__pct t-mono-xs">{{ Math.round(sceneProgress * 100) }}%</p>
    </div>

    <!-- Nameplate -->
    <div class="nameplate">
      <div class="nameplate__panel" />
      <h1 class="t-display nameplate__name">
        {{ site.firstName }}<br />Vervaecke<span class="dot">.</span>
      </h1>
      <p class="nameplate__role t-label">{{ site.title }}</p>
    </div>

    <!-- Boot prompt -->
    <div class="boot">
      <button class="w95-btn boot__btn" type="button" :disabled="booting" @click="requestBoot()">
        <PixelIcon name="disk" :size="16" />
        <span>ENTER_PORTFOLIO.EXE</span>
      </button>
      <p class="boot__hint t-mono-xs">
        {{ booting ? 'booting' : 'scroll down to boot' }}
        <span class="caret anim-blink">_</span>
      </p>
      <span class="boot__chev anim-float"><PixelIcon name="chevron" :size="18" /></span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 1;
}

/* Once the sequence starts, the overlay steps aside so the animation reads. */
.hero.is-loading .nameplate,
.hero.is-loading .boot,
.hero.is-booting .nameplate,
.hero.is-booting .boot {
  opacity: 0;
  transition: opacity 0.45s ease;
  pointer-events: none;
}

/* When the window is up the scene stays behind it, pushed back a touch. As
 * with the veil, the transition is declared only here — so opening eases in
 * and closing snaps back to a sharp scene with no drift. */
.hero.is-behind {
  filter: blur(3px) saturate(0.6);
  transform: scale(1.03);
  pointer-events: none;
  transition: filter 0.4s ease, transform 0.5s var(--ease-snap);
}

/* …and washes out to near-white, so the portfolio window sits on a clean
 * ground rather than on a dim render competing with it. */
.hero-veil {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  opacity: 0;
  /* Fully opaque: the portfolio opens onto its own ground, with none of the
   * office showing through. --page is the colour behind the image, so it is
   * what shows for the moment before the jpg has decoded.
   *
   * Note this layer is opaque by design — an alpha suffix in the colour
   * (#f4f1ec10 is 6% opaque) would leave the 3D scene visible through it. */
  background: var(--page) var(--veil-image) center / cover no-repeat;
}

/* The transition lives on the open state only. Removing the class removes the
 * transition with it, so closing the window snaps straight back to the scene
 * instead of fading the backdrop out over it. */
.hero.is-behind .hero-veil {
  opacity: 1;
  transition: opacity 0.4s ease;
}

/* The mat the framed scene sits on. */
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 50% 0%, #241f18 0%, var(--stage) 55%, var(--stage-edge) 100%);
}

/* --- the frame ----------------------------------------------------------
 * The scene sits inset from the edges rather than bleeding to the window, so
 * it reads as a framed picture. The inset shrinks on small screens, where
 * giving up 40px a side would cost too much of the view.
 * --------------------------------------------------------------------- */

.hero-frame {
  position: absolute;
  inset: 26px;
  z-index: 2;
  overflow: hidden;
  border: 1px solid rgba(255, 214, 170, 0.24);
  border-radius: 2px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.5),
    0 18px 50px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Corner ticks, so the frame reads as deliberate rather than as a stray border. */
.hero-frame::before,
.hero-frame::after {
  content: '';
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(255, 214, 170, 0.5);
  pointer-events: none;
  z-index: 3;
}

.hero-frame::before {
  top: 7px;
  left: 7px;
  border-right: 0;
  border-bottom: 0;
}

.hero-frame::after {
  right: 7px;
  bottom: 7px;
  border-left: 0;
  border-top: 0;
}

/* Darkens the edges of the render so the bright office does not run flat into
 * the frame, and so the nameplate has somewhere to sit. */
.hero-vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(115% 95% at 55% 40%, rgba(0, 0, 0, 0) 45%, rgba(20, 12, 6, 0.62) 100%),
    linear-gradient(to top, rgba(20, 12, 6, 0.5) 0%, rgba(20, 12, 6, 0) 32%);
}

/* --- loading screen ------------------------------------------------------
 * Sits above everything, frame included, until the scene is ready. Flat colour
 * on purpose: a loading screen that waits on its own backdrop to download is
 * not much of a loading screen.
 * --------------------------------------------------------------------- */

.loader {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  background: var(--stage);
  color: rgba(255, 226, 190, 0.9);
}

.loader__label {
  margin: 0;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.loader__track {
  width: min(300px, 52vw);
  height: 6px;
  background: rgba(255, 226, 190, 0.14);
  border: 1px solid rgba(255, 226, 190, 0.28);
}

.loader__fill {
  height: 100%;
  background: rgba(255, 190, 120, 0.9);
  transition: width 0.2s linear;
}

.loader__pct {
  margin: 0;
  letter-spacing: 0.12em;
  color: rgba(255, 226, 190, 0.62);
}

/* --- nameplate ---------------------------------------------------------- */

.nameplate {
  position: absolute;
  left: 62px;
  bottom: 152px;
  z-index: 4;
  color: #fff;
  padding: 14px 26px 18px 18px;
}

/* A soft slab behind the name — the office walls are near-white, and without
 * this the type disappears into them. Angled off to the right so it reads as
 * part of the composition rather than as a box. */
.nameplate__panel {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    100deg,
    rgba(12, 8, 5, 0.82) 0%,
    rgba(12, 8, 5, 0.66) 55%,
    rgba(12, 8, 5, 0) 100%
  );
  border-left: 2px solid rgba(255, 190, 120, 0.75);
  backdrop-filter: blur(3px);
}

.nameplate__name {
  margin: 0;
  font-size: clamp(38px, 7.4vw, 92px);
  color: #fff;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.55);
}

.nameplate__name .dot {
  color: #7fe3e3;
}

.nameplate__role {
  margin: 12px 0 0;
  display: inline-block;
  padding: 4px 10px;
  background: var(--navy);
  color: #fff;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
}

/* --- boot prompt -------------------------------------------------------- */

.boot {
  position: absolute;
  left: 50%;
  /* Clear of the frame, which is inset 26px. */
  bottom: 58px;
  transform: translateX(-50%);
  z-index: 4;
  display: grid;
  justify-items: center;
  gap: 8px;
  text-align: center;
}

.boot__btn {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  padding: 9px 20px;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
}

.boot__btn:hover {
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.6);
}

.boot__hint {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.caret {
  color: #7fe3e3;
}

.boot__chev {
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 820px) {
  .hero-frame {
    inset: 10px;
  }

  .nameplate {
    left: 22px;
    right: 22px;
    bottom: 150px;
  }

  .nameplate__name {
    text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
  }
}
</style>
