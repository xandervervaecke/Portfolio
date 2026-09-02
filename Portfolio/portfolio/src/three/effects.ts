import * as THREE from 'three'

/**
 * The intro reveal: the office powers up.
 *
 * It starts black, holds there for a beat, then the ceiling strip lights strike
 * on one at a time the way fluorescents actually do — a couple of false starts
 * before they hold — while the exposure climbs and the monitors flicker awake.
 *
 * It takes the scene apart and puts it back exactly as it found it, so `stop()`
 * is always safe, and safe to call twice.
 */

export interface IntroContext {
  renderer: THREE.WebGLRenderer
  /** Loaded model roots, keyed as in sceneConfig.models. */
  roots: Map<string, THREE.Object3D>
  /** Lights, keyed as in sceneConfig.lights (ceiling0, ceiling1, …). */
  lights: Map<string, THREE.Light>
  /** render.exposure, so the ramp knows what it is climbing back to. */
  baseExposure: number
}

export interface IntroSettings {
  /** Seconds of full darkness before the first tube tries to strike. */
  dark: number
  /** Seconds between one tube striking and the next. */
  stagger: number
  /** Seconds the exposure takes to climb back to normal, after `dark`. */
  duration: number
}

export interface Intro {
  /** Seconds the whole reveal runs for. */
  readonly duration: number
  start(): void
  /**
   * Called every frame. Takes no delta on purpose: elapsed time comes off the
   * wall clock, so the reveal lasts the same number of seconds whether the
   * scene is running at 120fps or struggling at 5. Driven off accumulated
   * frame deltas it stretched badly on slow hardware.
   */
  update(): void
  stop(): void
}

type StdMaterial = THREE.MeshStandardMaterial

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const clamp01 = (t: number) => Math.max(0, Math.min(1, t))

function materialsOf(root: THREE.Object3D) {
  const out: StdMaterial[] = []
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const m of mats) if (m) out.push(m as StdMaterial)
  })
  return out
}

interface Striking {
  light: THREE.Light
  target: number
  /** When it starts trying to strike, in seconds from the start. */
  at: number
  /** Alternating lit/dark durations after `at`. Empty means "just fade up". */
  blips: number[]
}

/** How the tubes stutter before they hold: lit, dark, lit, dark, lit. */
const STRIKE = [0.05, 0.09, 0.04, 0.16, 0.07]

export function createIntro(ctx: IntroContext, opts: IntroSettings): Intro {
  let strikes: Striking[] = []
  let screens: { mat: StdMaterial; intensity: number }[] = []
  let startedAt = 0

  const floor = () => ctx.baseExposure * 0.12

  return {
    duration: opts.dark + opts.duration,

    start() {
      startedAt = performance.now()

      // Ceiling tubes strike in order; everything else fades up underneath.
      const ordered = [...ctx.lights.entries()].sort(([a], [b]) => {
        const rank = (n: string) => (n.startsWith('ceiling') ? 0 : n === 'deskLamp' ? 1 : 2)
        return rank(a) - rank(b) || a.localeCompare(b)
      })

      strikes = ordered.map(([name, light], i) => {
        const isTube = name.startsWith('ceiling')
        light.intensity = 0
        return {
          light,
          target: light.userData.baseIntensity ?? light.intensity,
          at: opts.dark + (isTube ? i * opts.stagger : 0.15),
          blips: isTube ? STRIKE : [],
        }
      })

      // Monitors go dark, then flicker awake a beat after the first tube.
      const screenRoot = ctx.roots.get('screens')
      screens = screenRoot
        ? materialsOf(screenRoot).map((mat) => ({ mat, intensity: mat.emissiveIntensity }))
        : []
      for (const s of screens) s.mat.emissiveIntensity = 0

      ctx.renderer.toneMappingExposure = floor()
    },

    update() {
      const t = (performance.now() - startedAt) / 1000

      for (const s of strikes) {
        const local = t - s.at
        if (local < 0) {
          s.light.intensity = 0
          continue
        }
        if (s.blips.length) {
          // Walk the stutter; past the end of it, hold steady.
          let acc = 0
          let lit = false
          let inPattern = false
          for (let i = 0; i < s.blips.length; i++) {
            const next = acc + s.blips[i]!
            if (local < next) {
              lit = i % 2 === 0
              inPattern = true
              break
            }
            acc = next
          }
          if (inPattern) {
            s.light.intensity = lit ? s.target * 1.25 : 0
            continue
          }
        }
        const settle = clamp01((local - 0.4) / 0.5)
        s.light.intensity = s.target * easeOut(settle)
      }

      const sk = clamp01((t - opts.dark - 0.5) / 0.7)
      const flicker = sk > 0 && sk < 1 ? (Math.random() < 0.35 ? 0.2 : 1) : 1
      for (const s of screens) s.mat.emissiveIntensity = s.intensity * easeOut(sk) * flicker

      // Exposure holds at the floor through the dark, then climbs.
      const ek = clamp01((t - opts.dark) / (opts.duration * 0.8))
      ctx.renderer.toneMappingExposure = ctx.baseExposure * (0.12 + 0.88 * easeOut(ek))
    },

    stop() {
      for (const s of strikes) s.light.intensity = s.target
      for (const s of screens) s.mat.emissiveIntensity = s.intensity
      ctx.renderer.toneMappingExposure = ctx.baseExposure
      strikes = []
      screens = []
    },
  }
}
