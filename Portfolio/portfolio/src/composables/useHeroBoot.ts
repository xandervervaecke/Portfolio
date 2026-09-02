import { computed, readonly, ref } from 'vue'
import { useDesktop } from './useDesktop'
import { sceneConfig } from '../three/sceneConfig'

/* ---------------------------------------------------------------------------
 *  The handover between the hero's input gestures and the 3D scene.
 *
 *  Scroll / space / the boot button no longer open the desktop directly. They
 *  ask the scene to play its exit animation, and the scene says when it is done
 *  — or the ceiling in sceneConfig.animation.maxBootMs says so for it.
 * ------------------------------------------------------------------------ */

/** True from the moment the gesture lands until the desktop actually opens. */
const booting = ref(false)

/**
 * How far the 3D scene has got through loading, 0 → 1. Lives here rather than
 * inside HeroScene so the hero can put a loading screen over everything —
 * HeroScene is async-loaded, so it does not exist yet when loading starts.
 */
const sceneProgress = ref(0)
const sceneReady = computed(() => sceneProgress.value >= 1)

export function setSceneProgress(value: number) {
  sceneProgress.value = value
}

/** Installed by HeroScene while it is mounted. Null means "no scene to wait for". */
let runner: (() => void) | null = null

let ceiling = 0

/** HeroScene calls this on mount, and passes null on teardown. */
export function registerBootSequence(fn: (() => void) | null) {
  runner = fn
}

export function useHeroBoot() {
  const { desktopOpen, open } = useDesktop()

  /** Opens the portfolio. Safe to call twice — the second call does nothing. */
  function finishBoot() {
    if (!booting.value) return
    window.clearTimeout(ceiling)
    booting.value = false
    open()
  }

  function requestBoot() {
    if (booting.value || desktopOpen.value) return
    booting.value = true

    // Nothing is listening (scene still loading its chunk, or WebGL is out) —
    // don't make the visitor pay for that, just let them in.
    if (!runner) {
      booting.value = false
      open()
      return
    }

    // Whatever happens in the scene, the portfolio opens by this deadline.
    ceiling = window.setTimeout(finishBoot, sceneConfig.animation.maxBootMs)
    runner()
  }

  return {
    booting: readonly(booting),
    sceneProgress: readonly(sceneProgress),
    sceneReady,
    requestBoot,
    finishBoot,
  }
}
