<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { sceneConfig, type ModelSpec } from '../three/sceneConfig'
import { ScreenSim } from '../three/screenSim'
import { createIntro, type Intro } from '../three/effects'
import { registerBootSequence, setSceneProgress, useHeroBoot } from '../composables/useHeroBoot'
import { asset } from '../lib/asset'

/* ============================================================================
 *  THE OFFICE
 *
 *  Everything loadable in the repo-root  models/  folder, lit like a desk lamp
 *  at 7pm. You sit there typing on a loop; when a visitor asks to come in the
 *  character plays "spinning", the chair swings 125° a second later, and the
 *  portfolio opens the moment that clip ends (or at the 5s ceiling).
 *
 *  All the numbers — camera, model transforms, light colours, clip speeds —
 *  live in  src/three/sceneConfig.ts . Nothing here needs editing to lay the
 *  scene out.
 * ========================================================================= */

const props = withDefaults(defineProps<{ paused?: boolean }>(), { paused: false })

const cfg = sceneConfig
const { finishBoot } = useHeroBoot()
/** The power-up reveal, alive only while it is playing. */
let intro: Intro | undefined

const host = ref<HTMLDivElement | null>(null)
const failed = ref<string[]>([])
/** 0 → 1 across every model in the manifest; mirrored to useHeroBoot. */
const progress = ref(0)

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let camera: THREE.PerspectiveCamera | undefined
let controls: OrbitControls | undefined
let pmrem: THREE.PMREMGenerator | undefined
let observer: ResizeObserver | undefined
let raf = 0
let logTimer = 0

const timer = new THREE.Timer()
const disposed = new Set<THREE.Texture>()

/** Loaded model roots, by their config key. */
const roots = new Map<string, THREE.Object3D>()

/** Looping idle actions, by config key — so __hero.speed can reach them. */
const idleActions = new Map<string, THREE.AnimationAction>()

/** The fake desktop painted onto the monitors. */
let screenSim: ScreenSim | undefined

/* --- animation state ----------------------------------------------------- */

let mixer: THREE.AnimationMixer | undefined
let typingAction: THREE.AnimationAction | undefined
let spinAction: THREE.AnimationAction | undefined

/** Every mixer in the scene — the character's plus one per idling model. */
const mixers: THREE.AnimationMixer[] = []

/**
 * performance.now() at the moment the boot animation started; -1 while idle.
 * Wall clock rather than accumulated frame deltas, so the chair takes its one
 * second even on a machine dropping frames — and so it always lands well
 * inside the maxBootMs ceiling, which is wall clock too.
 */
let bootStart = -1
/**
 * The chair spins about its own centre, not its file origin — which sits off
 * to one side, so rotating the root swung the whole chair through an arc.
 * `chairPivot` is an empty parked at the chair's bounding-box centre with the
 * chair re-parented under it; rotating the pivot turns the chair on the spot.
 */
let chairPivot: THREE.Object3D | undefined
let chairBaseY = 0
/** Set once per boot, so the desktop only ever opens once per run. */
let bootHandled = false

/* --- byte-accurate loading progress -------------------------------------- */

const bytes = new Map<string, { loaded: number; total: number }>()

function trackProgress(url: string, e: ProgressEvent) {
  if (!e.lengthComputable) return
  bytes.set(url, { loaded: e.loaded, total: e.total })
  publishProgress()
}

function publishProgress() {
  const specs = cfg.models.filter((m) => m.enabled)
  if (!specs.length) return void (progress.value = 1)

  let sum = 0
  for (const spec of specs) {
    const b = bytes.get(spec.url)
    sum += b ? Math.min(1, b.loaded / (b.total || 1)) : 0
  }
  progress.value = sum / specs.length
  setSceneProgress(progress.value)
}

/* --- texture resolution --------------------------------------------------- */

/**
 * The FBX files here were exported with absolute paths off the machine that
 * made them (C:\Users\…\some_texture.png). Nothing on the web can follow that,
 * so we keep the file name and look for it in  models/textures/ .
 */
function textureUrlFor(url: string, spec: ModelSpec) {
  if (/^(blob:|data:|https?:)/.test(url)) return url
  let name = url.split(/[\\/]/).pop() ?? url

  // An explicit mapping wins. Guessing an extension works right up until one
  // of these files turns out to be a .png, so anything awkward gets named
  // outright in the model's `textures` map.
  const mapped = spec.textures?.[name] ?? spec.textures?.[name.replace(/\.[a-z0-9]+$/i, '')]
  if (mapped) return asset(mapped)

  // Otherwise: exporters that round-tripped through glTF drop the extension
  // entirely — ryder.fbx asks for a bare "Image_0_003". Those default to .jpg.
  if (!/\.[a-z0-9]+$/i.test(name)) name += '.jpg'
  return asset(`/models/textures/${name}`)
}

/** A 1×1 transparent PNG, used to stand in for textures we know are missing. */
const BLANK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAA' +
  'C0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** Geometry containers, as opposed to the textures hanging off them. */
const MODEL_FILE = /\.(fbx|glb|gltf|bin)$/i

/**
 * Where each model's textures came from, reported in dev.
 *
 * "embedded" is the only trustworthy answer. Anything listed as "guessed" was
 * resolved by filename out of  models/textures/ , because the file itself only
 * stored an absolute path from the machine that exported it — see the export
 * notes at the top of sceneConfig.ts.
 */
const textureOrigins = new Map<string, Set<string>>()

function noteTextureOrigin(key: string, origin: string) {
  if (!import.meta.env.DEV) return
  const set = textureOrigins.get(key) ?? new Set<string>()
  set.add(origin)
  textureOrigins.set(key, set)
}

function reportTextureOrigins() {
  if (!import.meta.env.DEV || !textureOrigins.size) return
  const guessed: string[] = []
  for (const [key, origins] of textureOrigins) {
    for (const o of origins) if (o.startsWith('guessed')) guessed.push(`${key}: ${o}`)
  }
  if (!guessed.length) return
  console.warn(
    [
      '[hero] These textures are guesses — the model file did not carry its own:',
      ...guessed.map((g) => '  ' + g),
      '  Re-export as .glb (or .fbx with Path Mode: Copy + Embed Textures) and the',
      '  real ones travel inside the file, with no mapping needed here.',
    ].join('\n'),
  )
}

function makeManager(spec: ModelSpec) {
  const manager = new THREE.LoadingManager()
  manager.setURLModifier((url) => {
    // The manager sees the model file itself as well as its textures; only the
    // textures need rewriting. Note that FBXLoader has already joined its own
    // resourcePath on by this point, so a texture can arrive looking like a
    // real /models/textures/ path and still be missing its extension.
    if (url === spec.url || MODEL_FILE.test(url)) return asset(url)
    // A blob: URL means the texture travelled inside the model file. That is
    // the only case where we know it is the right one.
    if (/^(blob:|data:)/.test(url)) {
      noteTextureOrigin(spec.key, 'embedded')
      return url
    }
    // Models whose textures never made it out of the exporter get a flat
    // colour instead — no point firing off requests that can only 404.
    if (spec.fallbackColor) return BLANK_PNG

    const name = url.split(/[\/]/).pop() ?? url
    const resolved = textureUrlFor(url, spec)
    noteTextureOrigin(
      spec.key,
      `guessed "${name}" -> ${resolved}` + (spec.textures?.[name] ? ' (mapped by hand)' : ''),
    )
    return resolved
  })
  return manager
}

/* --- model loading -------------------------------------------------------- */

const DEG = Math.PI / 180

/**
 * Rebuilds a Phong material (which is all FBXLoader ever makes) as a Standard
 * one. Phong applies scene.environment at full reflectivity and adds a
 * specular highlight on top, so beside the .glb models the .fbx cast reads as
 * shiny plastic. Standard with a high roughness puts them on the same footing.
 */
function toStandard(src: THREE.Material, spec: ModelSpec) {
  const p = src as THREE.MeshPhongMaterial
  const std = new THREE.MeshStandardMaterial({
    name: p.name,
    color: p.color,
    map: p.map,
    normalMap: p.normalMap,
    normalScale: p.normalScale,
    bumpMap: p.bumpMap,
    bumpScale: p.bumpScale,
    alphaMap: p.alphaMap,
    aoMap: p.aoMap,
    emissive: p.emissive,
    emissiveMap: p.emissiveMap,
    emissiveIntensity: p.emissiveIntensity,
    transparent: p.transparent,
    opacity: p.opacity,
    alphaTest: p.alphaTest,
    depthWrite: p.depthWrite,
    side: p.side,
    vertexColors: p.vertexColors,
    roughness: spec.roughness ?? cfg.materials.roughness,
    metalness: spec.metalness ?? cfg.materials.metalness,
  })
  std.envMapIntensity = cfg.materials.envMapIntensity
  return std
}

function applySpec(root: THREE.Object3D, spec: ModelSpec) {
  root.position.fromArray(spec.position)
  root.rotation.set(
    spec.rotationDeg[0] * DEG,
    spec.rotationDeg[1] * DEG,
    spec.rotationDeg[2] * DEG,
  )
  root.scale.setScalar(spec.scale)
  root.name = spec.key
  root.visible = spec.visible !== false

  // FBX materials are shared across meshes, so convert each one once and hand
  // every mesh using it the same replacement.
  const converted = new Map<THREE.Material, THREE.Material>()

  const prepare = (mat: THREE.Material) => {
    let out = converted.get(mat)
    if (!out) {
      const isPhongish =
        (mat as THREE.MeshPhongMaterial).isMeshPhongMaterial ||
        (mat as THREE.MeshLambertMaterial).isMeshLambertMaterial
      out = cfg.materials.convertPhong && isPhongish ? toStandard(mat, spec) : mat

      const m = out as THREE.MeshStandardMaterial
      if (spec.fallbackColor) {
        // Drop the dead texture slots so the flat colour actually shows.
        m.map = null
        m.color = new THREE.Color(spec.fallbackColor)
      } else if (spec.color) {
        // Tint: the map survives and is multiplied by this.
        m.color = new THREE.Color(spec.color)
      }
      // Only meaningful on Standard/Physical — a material we chose not to
      // convert has no such properties and is left alone.
      if (m.isMeshStandardMaterial) {
        if (spec.roughness !== undefined) m.roughness = spec.roughness
        if (spec.metalness !== undefined) m.metalness = spec.metalness
      }
      m.needsUpdate = true

      if (out !== mat) mat.dispose()
      converted.set(mat, out)
    }
    return out
  }

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return

    mesh.castShadow = spec.castShadow ?? true
    mesh.receiveShadow = spec.receiveShadow ?? true

    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(prepare)
      : prepare(mesh.material)
  })
}

function loadModel(spec: ModelSpec): Promise<THREE.Object3D | null> {
  const manager = makeManager(spec)
  const isFbx = spec.url.toLowerCase().endsWith('.fbx')
  const loader = isFbx ? new FBXLoader(manager) : new GLTFLoader(manager)
  // FBXLoader joins bare texture names onto this; our URL modifier fixes the
  // absolute ones, this covers anything that arrives already relative.
  loader.setResourcePath(asset('/models/textures/'))

  return new Promise((resolve) => {
    loader.load(
      spec.url,
      (result) => {
        const root = isFbx
          ? (result as THREE.Group)
          : (result as { scene: THREE.Group }).scene
        const clips = isFbx
          ? (result as THREE.Group).animations
          : (result as { animations: THREE.AnimationClip[] }).animations

        // GLTFLoader hangs the clips off the gltf object rather than the scene;
        // put them on the root either way so __hero.roots can show them.
        root.animations = clips ?? []

        applySpec(root, spec)
        roots.set(spec.key, root)
        scene?.add(root)

        if (spec.key === 'character') setupCharacter(root, clips ?? [])
        else setupIdle(root, clips ?? [], spec)
        if (spec.key === 'chair') setupChairPivot(root)
        if (spec.key === 'screens') setupScreens(root)

        // A finished file counts as fully loaded even if it never reported size.
        bytes.set(spec.url, { loaded: 1, total: 1 })
        publishProgress()
        resolve(root)
      },
      (e) => trackProgress(spec.url, e as ProgressEvent),
      () => {
        failed.value = [...failed.value, spec.url]
        bytes.set(spec.url, { loaded: 1, total: 1 })
        publishProgress()
        resolve(null)
      },
    )
  })
}

/**
 * Paints the monitors with the fake desktop. The same canvas is used as the
 * colour map and the emissive map, so the screens light the room themselves —
 * which is what the old screenGlow point light was faking.
 */
function setupScreens(root: THREE.Object3D) {
  if (!cfg.screen.enabled) return
  screenSim = new ScreenSim({
    width: cfg.screen.width,
    height: cfg.screen.height,
    fps: cfg.screen.fps,
    desktop: cfg.screen.desktop,
    accent: cfg.screen.accent,
    flipY: cfg.screen.flipY,
  })

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      const m = mat as THREE.MeshStandardMaterial
      if (!m?.isMeshStandardMaterial) continue
        // The monitor UVs run the other way up, so the canvas needs turning.
      screenSim!.texture.center.set(0.5, 0.5)
      screenSim!.texture.rotation = cfg.screen.rotateDeg * DEG
      m.map = screenSim!.texture
      m.emissiveMap = screenSim!.texture
      m.emissive = new THREE.Color(0xffffff)
      m.emissiveIntensity = cfg.screen.emissiveIntensity
      m.color = new THREE.Color(0xffffff)
      m.roughness = 0.35
      m.metalness = 0
      m.needsUpdate = true
    }
  })
}

/**
 * The photo backdrop. Counted alongside the models so the loading screen does
 * not clear before it is up — otherwise the flat colour shows first and the
 * sky pops in a moment later.
 */
function loadBackground(url: string): Promise<void> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      asset(url),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        if (scene) scene.background = tex
        resolve()
      },
      undefined,
      () => {
        // Leave the flat colour in place and say so, rather than failing quietly.
        failed.value = [...failed.value, url]
        resolve()
      },
    )
  })
}

/* --- the character and its two clips -------------------------------------- */

function findClip(clips: THREE.AnimationClip[], name: string, fallbackIndex: number) {
  const wanted = name.toLowerCase()
  return (
    clips.find((c) => c.name.toLowerCase() === wanted) ??
    clips.find((c) => c.name.toLowerCase().includes(wanted)) ??
    clips[fallbackIndex]
  )
}

function setupCharacter(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
  if (!clips.length) return

  mixer = new THREE.AnimationMixer(root)
  mixers.push(mixer)
  mixer.addEventListener('finished', (e) => {
    if ((e as unknown as { action: THREE.AnimationAction }).action === spinAction) {
      completeBoot()
    }
  })

  const typingClip = findClip(clips, cfg.animation.typing.clip, 0)
  const spinClip = findClip(clips, cfg.animation.spin.clip, 1)

  if (typingClip) {
    typingAction = mixer.clipAction(typingClip)
    typingAction.setLoop(THREE.LoopRepeat, Infinity)
    typingAction.setEffectiveTimeScale(cfg.animation.typing.speed)
    typingAction.play()
  }

  if (spinClip && spinClip !== typingClip) {
    spinAction = mixer.clipAction(spinClip)
    spinAction.setLoop(THREE.LoopOnce, 1)
    spinAction.clampWhenFinished = true
    spinAction.setEffectiveTimeScale(cfg.animation.spin.speed)
  }
}

/**
 * Loops one clip out of a model's own file. Used for the background cast —
 * the character's typing/spinning pair is handled by setupCharacter instead.
 */
/**
 * True if any track in the clip actually changes value. Several of the .fbx
 * files here carry a one-frame "action" that is really just the rest pose —
 * playing one costs a mixer every frame and moves nothing.
 */
function clipHasMotion(clip: THREE.AnimationClip) {
  for (const track of clip.tracks) {
    const v = track.values
    const stride = v.length / track.times.length
    for (let i = 1; i < track.times.length; i++) {
      for (let k = 0; k < stride; k++) {
        if (Math.abs(v[i * stride + k]! - v[k]!) > 1e-3) return true
      }
    }
  }
  return false
}

/** Largest per-component change between two adjacent keys of a track. */
function keyDelta(track: THREE.KeyframeTrack, a: number, b: number, stride: number) {
  let max = 0
  for (let k = 0; k < stride; k++) {
    max = Math.max(max, Math.abs(track.values[b * stride + k]! - track.values[a * stride + k]!))
  }
  return max
}

/**
 * Blender's FBX exporter tends to write a rest-pose key at frame 0, ahead of
 * where the action actually starts. It shows up as a single-frame T-pose on
 * every loop — a hard snap on `repeat`, a flick at the turnaround on
 * `pingpong`.
 *
 * Detected by shape rather than by name: on an animated track, the step from
 * key 0 to key 1 is wildly bigger than every other step in the track. Comparing
 * against the skeleton's bind pose would be the obvious test, but the track
 * names in these files do not reliably match the bone names (ryder animates
 * `GLTF_SceneRootNode`, tyler animates `Normal`), whereas the shape of the
 * outlier is the same in every rig.
 *
 * Returns true if a key was removed.
 */
function trimLeadingRestPose(clip: THREE.AnimationClip) {
  let animated = 0
  let leadingOutlier = 0

  for (const track of clip.tracks) {
    const n = track.times.length
    // Needs enough keys to have a "typical" step to compare the first one to.
    if (n < 6) continue
    const stride = track.values.length / n

    const steps: number[] = []
    for (let i = 1; i < n - 1; i++) steps.push(keyDelta(track, i, i + 1, stride))
    steps.sort((a, b) => a - b)
    const median = steps[Math.floor(steps.length / 2)] ?? 0
    const first = keyDelta(track, 0, 1, stride)

    animated++
    // A real first frame moves about as much as any other. A rest-pose key
    // jumps an order of magnitude further.
    if (first > Math.max(median * 8, 1e-4)) leadingOutlier++
  }

  if (animated < 3 || leadingOutlier / animated < 0.6) return false

  const start = Math.min(...clip.tracks.map((t) => t.times[0] ?? 0))
  for (const track of clip.tracks) {
    if (track.times.length < 2 || (track.times[0] ?? 0) > start + 1e-6) continue
    const stride = track.values.length / track.times.length
    track.times = track.times.slice(1) as typeof track.times
    track.values = track.values.slice(stride) as typeof track.values
  }

  // Re-zero what is left, so the clip still starts at t=0.
  const newStart = Math.min(...clip.tracks.map((t) => t.times[0] ?? 0))
  if (newStart > 0) {
    for (const track of clip.tracks) {
      for (let i = 0; i < track.times.length; i++) track.times[i]! -= newStart
    }
  }
  clip.resetDuration()
  return true
}

function setupIdle(root: THREE.Object3D, clips: THREE.AnimationClip[], spec: ModelSpec) {
  if (!clips.length || !spec.idle) return

  // Prefer the named clip, but only if it actually moves — these files tend to
  // carry a rest-pose clip alongside the real one, sometimes under the name you
  // would have picked. Otherwise take whichever clip does move.
  const usable = (c: THREE.AnimationClip) => c.duration > 0 && clipHasMotion(c)
  const named = spec.idle.clip
    ? clips.find((c) => c.name.toLowerCase() === spec.idle!.clip!.toLowerCase())
    : undefined
  const clip = named && usable(named) ? named : clips.find(usable)
  if (!clip) {
    if (import.meta.env.DEV) {
      console.warn(
        `[hero] "${spec.key}" has an idle configured but no clip that moves — ` +
          `${clips.map((c) => `${c.name} (${c.duration.toFixed(3)}s)`).join(', ') || 'no clips'}. ` +
          `The file was exported without baked keyframes; it needs re-exporting.`,
      )
    }
    return
  }

  const trimmed = spec.idle.trimRestPose === false ? false : trimLeadingRestPose(clip)

  const m = new THREE.AnimationMixer(root)
  mixers.push(m)
  const action = m.clipAction(clip)
  action.setLoop(
    spec.idle.loop === 'pingpong' ? THREE.LoopPingPong : THREE.LoopRepeat,
    Infinity,
  )
  action.setEffectiveTimeScale(spec.idle.speed ?? 1)
  action.play()

  if (clip.duration <= 0) {
    // Nothing left to play — the clip was a rest pose plus one real pose. Hold
    // that pose instead: a paused action still applies its frame every update,
    // where simply not playing would leave the mesh in its bind pose.
    action.paused = true
    action.time = 0
    if (import.meta.env.DEV) {
      console.warn(
        `[hero] "${spec.key}" holds a single pose: its clip was two keyframes, ` +
          `the first of them the rest pose. Re-export with baked keyframes for ` +
          `actual motion.`,
      )
    }
  } else if (trimmed && import.meta.env.DEV) {
    console.info(`[hero] "${spec.key}": dropped a leading rest-pose keyframe.`)
  }

  idleActions.set(spec.key, action)
}

/**
 * Re-parents the chair under an empty sitting at its own centre, so the boot
 * swing rotates it in place. Without this the chair turns about its file
 * origin, which is off to one side, and the whole thing swings through an arc.
 */
function setupChairPivot(root: THREE.Object3D) {
  if (!scene) return
  root.updateMatrixWorld(true)

  // Centre in X/Z only: the pivot should sit on the chair's axis, at its own
  // base height, so it spins like a chair rather than tumbling about its waist.
  const box = new THREE.Box3().setFromObject(root)
  const centre = box.getCenter(new THREE.Vector3())

  const pivot = new THREE.Object3D()
  pivot.name = 'chairPivot'
  pivot.position.set(centre.x, box.min.y, centre.z)
  scene.add(pivot)

  // Keep the chair exactly where it is by shifting it back by the pivot offset.
  root.position.sub(pivot.position)
  pivot.add(root)

  chairPivot = pivot
  chairBaseY = pivot.rotation.y
}

/* --- the boot sequence ---------------------------------------------------- */

function completeBoot() {
  if (bootHandled) return
  bootHandled = true
  // The render loop stops the moment the desktop opens, so make sure the chair
  // is not frozen halfway round if the ceiling cut the sequence short.
  driveChair(cfg.chairSpin.delay + cfg.chairSpin.duration)
  finishBoot()
}

/** Runs the exit animation. The chair swing is driven per-frame in tick(). */
function playBoot() {
  bootHandled = false
  bootStart = performance.now()

  if (!spinAction) {
    // No clip to play — nothing to wait for.
    completeBoot()
    return
  }

  spinAction.reset()
  spinAction.setEffectiveTimeScale(cfg.animation.spin.speed)
  spinAction.setEffectiveWeight(1)
  spinAction.play()
  typingAction?.crossFadeTo(spinAction, cfg.animation.crossfade, false)
}

/** Back to typing, chair straight — re-arms the hero for another boot. */
function resetBoot() {
  bootStart = -1
  bootHandled = false
  spinAction?.stop()
  if (chairPivot) chairPivot.rotation.y = chairBaseY
  if (typingAction) {
    typingAction.reset()
    typingAction.setEffectiveWeight(1)
    typingAction.play()
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function driveChair(t: number) {
  if (!chairPivot) return
  const { delay, duration, degrees } = cfg.chairSpin
  if (t < delay) return
  const k = duration > 0 ? Math.min(1, (t - delay) / duration) : 1
  chairPivot.rotation.y = chairBaseY + degrees * DEG * easeInOut(k)
}

/* --- camera --------------------------------------------------------------- */

const target = new THREE.Vector3().fromArray(cfg.camera.target)
const pointer = new THREE.Vector2(0, 0)
const pointerTarget = new THREE.Vector2(0, 0)

function onPointerMove(e: PointerEvent) {
  pointerTarget.set(
    (e.clientX / window.innerWidth) * 2 - 1,
    (e.clientY / window.innerHeight) * 2 - 1,
  )
}

const f2 = (n: number) => n.toFixed(2)

function logCamera() {
  if (!camera || !controls) return
  const p = camera.position
  const t = controls.target
  console.log(
    `[hero camera] paste into src/three/sceneConfig.ts\n` +
      `  camera: {\n` +
      `    position: [${f2(p.x)}, ${f2(p.y)}, ${f2(p.z)}],\n` +
      `    target: [${f2(t.x)}, ${f2(t.y)}, ${f2(t.z)}],\n` +
      `    fov: ${camera.fov},\n` +
      `  }`,
  )
}

/* --- lighting ------------------------------------------------------------- */

/** Every light in the scene, by the name it has in sceneConfig.lights. */
const lights = new Map<string, THREE.Light>()
let lightHelpers: THREE.Object3D[] = []

function buildLights(target: THREE.Scene) {
  const L = cfg.lights
  const R = cfg.render

  /** Shared shadow setup, so every caster gets the same softness and bias. */
  const enableShadow = (light: THREE.DirectionalLight | THREE.PointLight, far: number) => {
    light.castShadow = true
    light.shadow.mapSize.set(R.shadowMapSize, R.shadowMapSize)
    light.shadow.radius = R.shadowRadius
    light.shadow.bias = -0.0006
    light.shadow.normalBias = 0.03
    light.shadow.camera.near = 0.2
    light.shadow.camera.far = far
  }

  const add = (name: string, light: THREE.Light) => {
    // Effects that dim the rig need somewhere to read the intended level from.
    light.userData.baseIntensity = light.intensity
    lights.set(name, light)
    target.add(light)
    return light
  }

  add('hemi', new THREE.HemisphereLight(L.hemi.sky, L.hemi.ground, L.hemi.intensity))
  add('ambient', new THREE.AmbientLight(L.ambient.color, L.ambient.intensity))

  // Daylight: aimed at the room rather than at the world origin, which sits
  // below the floor and would rake the whole scene from underneath.
  const sun = new THREE.DirectionalLight(L.daylight.color, L.daylight.intensity)
  sun.position.fromArray(L.daylight.position)
  sun.target.position.fromArray(L.daylight.target)
  target.add(sun.target)
  if (R.shadows && L.daylight.castShadow) {
    enableShadow(sun, 60)
    // A directional light shadows through an orthographic box; size it to the
    // room or the shadows simply stop partway across the floor.
    const b = L.daylight.shadowBounds
    const cam = sun.shadow.camera as THREE.OrthographicCamera
    cam.left = -b
    cam.right = b
    cam.top = b
    cam.bottom = -b
    cam.updateProjectionMatrix()
  }
  add('daylight', sun)

  // Ceiling lights, plus the desk lamp — all point lights of the same shape.
  const points: [string, (typeof L.ceiling)[number]][] = L.ceiling.map((c, i) => [
    `ceiling${i}`,
    c,
  ])
  points.push(['deskLamp', L.deskLamp])

  for (const [name, c] of points) {
    const light = new THREE.PointLight(c.color, c.intensity, c.distance, c.decay)
    light.position.fromArray(c.position)
    if (R.shadows && c.castShadow) enableShadow(light, c.distance)
    add(name, light)
  }

  if (cfg.debug.lightHelpers) showLightHelpers(true)
}

/** Wireframe markers at each light. Toggleable live via __hero.helpers(). */
function showLightHelpers(on: boolean) {
  if (!scene) return on
  for (const h of lightHelpers) {
    scene.remove(h)
    ;(h as unknown as { dispose?: () => void }).dispose?.()
  }
  lightHelpers = []
  if (!on) return false

  for (const [name, light] of lights) {
    let helper: THREE.Object3D | undefined
    if ((light as THREE.PointLight).isPointLight) {
      helper = new THREE.PointLightHelper(light as THREE.PointLight, 0.2)
    } else if ((light as THREE.DirectionalLight).isDirectionalLight) {
      helper = new THREE.DirectionalLightHelper(light as THREE.DirectionalLight, 0.8)
    }
    if (helper) {
      helper.name = `helper:${name}`
      lightHelpers.push(helper)
      scene.add(helper)
    }
  }
  return true
}

/** Live edit of one light. Returns what it looks like afterwards. */
function patchLight(
  name: string,
  patch: {
    intensity?: number
    color?: string
    ground?: string
    position?: [number, number, number]
    distance?: number
    decay?: number
  },
) {
  const light = lights.get(name)
  if (!light) return `no light named "${name}" — try: ${[...lights.keys()].join(', ')}`

  if (patch.intensity !== undefined) light.intensity = patch.intensity
  if (patch.color !== undefined) light.color.set(patch.color)
  if (patch.ground !== undefined) (light as THREE.HemisphereLight).groundColor?.set(patch.ground)
  if (patch.position !== undefined) light.position.fromArray(patch.position)

  const point = light as THREE.PointLight
  if (patch.distance !== undefined && point.isPointLight) {
    point.distance = patch.distance
    if (point.castShadow) point.shadow.camera.far = patch.distance
  }
  if (patch.decay !== undefined && point.isPointLight) point.decay = patch.decay

  for (const h of lightHelpers) (h as THREE.PointLightHelper).update?.()
  return describeLight(name, light)
}

function describeLight(name: string, light: THREE.Light) {
  const n = (v: number) => Number(v.toFixed(3))
  const pos = light.position.toArray().map((v) => Number(v.toFixed(2)))
  const hex = (c: THREE.Color) => '#' + c.getHexString()

  if ((light as THREE.HemisphereLight).isHemisphereLight) {
    const h = light as THREE.HemisphereLight
    return `    ${name}: { sky: '${hex(h.color)}', ground: '${hex(h.groundColor)}', intensity: ${n(h.intensity)} },`
  }
  if ((light as THREE.AmbientLight).isAmbientLight) {
    return `    ${name}: { color: '${hex(light.color)}', intensity: ${n(light.intensity)} },`
  }
  if ((light as THREE.PointLight).isPointLight) {
    const p = light as THREE.PointLight
    return (
      `    ${name}: {
` +
      `      color: '${hex(p.color)}',
` +
      `      intensity: ${n(p.intensity)},
` +
      `      distance: ${n(p.distance)},
` +
      `      decay: ${n(p.decay)},
` +
      `      position: [${pos.join(', ')}] as Vec3,
` +
      `      castShadow: ${p.castShadow},
` +
      `    },`
    )
  }
  const d = light as THREE.DirectionalLight
  return (
    `    ${name}: {
` +
    `      color: '${hex(d.color)}',
` +
    `      intensity: ${n(d.intensity)},
` +
    `      position: [${pos.join(', ')}] as Vec3,
` +
    `      castShadow: ${d.castShadow},
` +
    `      shadowBounds: ${cfg.lights.daylight.shadowBounds},
` +
    `    },`
  )
}

/** Prints the whole lighting rig in sceneConfig shape, ready to paste back. */
function dumpLights() {
  const order = ['hemi', 'ambient', 'daylight', ...lights.keys()].filter(
    (n, i, a) => a.indexOf(n) === i,
  )
  const body = order
    .filter((n) => lights.has(n))
    .map((n) => describeLight(n, lights.get(n)!))
    .join('\n')
  console.log(
    [
      '[hero lights] paste over sceneConfig.lights, and exposure into render:',
      `  exposure: ${renderer ? Number(renderer.toneMappingExposure.toFixed(3)) : '?'},`,
      '  lights: {',
      body,
      '  },',
    ].join('\n'),
  )
}

/* --- the intro reveal ------------------------------------------------------ */

function stopIntro() {
  intro?.stop()
  intro = undefined
}

/**
 * Starts the power-up. Called once, straight after loading and *before* the
 * loading screen clears — so the first frame of the office anyone sees is
 * already dark, rather than a flash of the fully lit room.
 */
function startIntro() {
  stopIntro()
  if (!cfg.intro.enabled || !renderer) return
  intro = createIntro(
    { renderer, roots, lights, baseExposure: cfg.render.exposure },
    cfg.intro,
  )
  intro.start()
}

/* --- render loop ---------------------------------------------------------- */

function tick() {
  raf = requestAnimationFrame(tick)
  if (!renderer || !scene || !camera) return

  timer.update()
  const dt = Math.min(timer.getDelta(), 0.1)

  for (const m of mixers) m.update(dt)
  screenSim?.update(dt)
  intro?.update()

  if (bootStart >= 0) driveChair((performance.now() - bootStart) / 1000)

  if (cfg.debug.camera) {
    controls?.update()
  } else if (cfg.camera.parallax > 0) {
    // The frame drifts a little with the cursor — enough to feel alive, not
    // enough to leave the composition you picked.
    pointer.lerp(pointerTarget, Math.min(1, dt * 3))
    const base = cfg.camera.position
    const k = cfg.camera.parallax
    camera.position.x += (base[0] + pointer.x * k - camera.position.x) * Math.min(1, dt * 1.8)
    camera.position.y += (base[1] - pointer.y * k - camera.position.y) * Math.min(1, dt * 1.8)
    camera.lookAt(target)
  }

  renderer.render(scene, camera)
}

function resize() {
  if (!renderer || !camera || !host.value) return
  const { clientWidth: w, clientHeight: h } = host.value
  if (!w || !h) return
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}

/* --- lifecycle ------------------------------------------------------------ */

onMounted(async () => {
  if (!host.value) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(cfg.render.background)
  if (cfg.render.fog.enabled) {
    scene.fog = new THREE.Fog(cfg.render.fog.color, cfg.render.fog.near, cfg.render.fog.far)
  }

  camera = new THREE.PerspectiveCamera(cfg.camera.fov, 1, cfg.camera.near, cfg.camera.far)
  camera.position.fromArray(cfg.camera.position)
  camera.lookAt(target)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, cfg.render.maxPixelRatio))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = cfg.render.exposure
  if (cfg.render.shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
  }
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  host.value.appendChild(renderer.domElement)

  // A neutral room reflection so gloss and metal have something to catch.
  pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = cfg.render.environmentIntensity

  buildLights(scene)

  // Only built while you are hunting for a camera position. Outside of that
  // the view is fixed, and OrbitControls is not created at all — merely
  // disabling it would still leave its pointer, wheel and touch listeners on
  // the canvas, which is what made the view feel draggable.
  if (cfg.debug.camera) {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.target.copy(target)
    controls.update()
  }

  resize()
  observer = new ResizeObserver(resize)
  observer.observe(host.value)
  // No parallax means nothing to track, so do not listen at all.
  if (cfg.camera.parallax > 0) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }

  registerBootSequence(playBoot)

  if (cfg.debug.camera) {
    logCamera()
    logTimer = window.setInterval(logCamera, cfg.debug.logEveryMs)
  }

  if (!props.paused) tick()

  // Kick every model off at once; each one drops into the scene as it lands.
  const jobs: Promise<unknown>[] = cfg.models.filter((m) => m.enabled).map(loadModel)
  if (cfg.render.backgroundImage) jobs.push(loadBackground(cfg.render.backgroundImage))
  await Promise.all(jobs)
  progress.value = 1

  // Darken before handing over: setSceneProgress(1) is what pulls the loading
  // screen away, so the reveal has to be set up on this side of it.
  startIntro()

  setSceneProgress(1)
  reportTextureOrigins()

  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__hero = {
      /** __hero.speed('typing' | 'spin' | any idling model's key, 0.6) */
      speed(which: string, value: number) {
        const action =
          which === 'typing' ? typingAction : which === 'spin' ? spinAction : idleActions.get(which)
        action?.setEffectiveTimeScale(value)
        return action ? value : `no action named "${which}"`
      },
      /** Play the exit animation + chair swing without opening the portfolio. */
      play: playBoot,
      /** Back to typing, chair straight. */
      reset: resetBoot,
      /** Print the camera block right now. */
      camera: logCamera,
      /**
       * Live-edit one light, e.g.
       *   __hero.light('lamp', { intensity: 12, position: [4.3, 4.6, 1.9] })
       *   __hero.light('hemi', { intensity: 0.7, ground: '#3a2a1e' })
       */
      light: patchLight,
      /** Print the whole rig in sceneConfig shape, ready to paste back. */
      lights: dumpLights,
      /** Overall brightness, without a reload. */
      exposure(v: number) {
        if (renderer) renderer.toneMappingExposure = v
        return v
      },
      /** Show/hide wireframe markers at each light. */
      helpers: showLightHelpers,
      /** The loaded model roots, keyed as in sceneConfig — for live nudging. */
      roots,
      /** The live camera and orbit controls, for scripted moves. */
      get view() { return { camera, controls, renderer, scene } },
      /** The character's mixer and its two actions, for poking at directly. */
      get mixer() { return mixer },
      get actions() { return { typing: typingAction, spin: spinAction, idle: idleActions } },
      THREE,
    }
    console.log(
      [
        '[hero] console helpers:',
        "  __hero.light('lamp', { intensity: 12, position: [4.3, 4.6, 1.9] })",
        '  __hero.lights()      print the rig, ready to paste into sceneConfig',
        '  __hero.exposure(0.8) overall brightness',
        '  __hero.helpers(true) wireframe markers at each light',
        "  __hero.speed('typing', 0.5) / __hero.play() / __hero.reset() / __hero.roots",
      ].join('\n'),
    )
  }
})

watch(
  () => props.paused,
  (paused) => {
    cancelAnimationFrame(raf)
    raf = 0
    if (!paused) {
      // Coming back from the desktop: the character is clamped on the last
      // frame of "spinning" and the chair is round the wrong way. Re-arm, so
      // the hero is ready to be booted again.
      if (bootStart >= 0) resetBoot()
      timer.update() // drop the gap so nothing jumps on resume

      // Wake the office up again rather than having it simply be there. Only
      // once the models are in — if the visitor deep-linked into the portfolio
      // and closed it mid-load, the loading screen is still up and the reveal
      // is started by the loader instead.
      if (cfg.intro.enabled && cfg.intro.onReturn && progress.value >= 1) {
        startIntro()
        // The render loop has been stopped, so the canvas is still holding the
        // last lit frame. Paint the darkened one now: this watcher runs before
        // Vue updates the DOM, so it lands before the veil is taken away.
        if (renderer && scene && camera) renderer.render(scene, camera)
      }

      tick()
    }
  },
)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.clearInterval(logTimer)
  observer?.disconnect()
  window.removeEventListener('pointermove', onPointerMove)
  registerBootSequence(null)

  stopIntro()
  for (const m of mixers) m.stopAllAction()
  mixers.length = 0
  screenSim?.dispose()
  screenSim = undefined
  controls?.dispose()

  scene?.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    mesh.geometry?.dispose?.()
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      if (!mat) continue
      for (const value of Object.values(mat)) {
        const tex = value as THREE.Texture
        if (tex?.isTexture && !disposed.has(tex)) {
          disposed.add(tex)
          tex.dispose()
        }
      }
      mat.dispose()
    }
  })

  scene?.environment?.dispose()
  pmrem?.dispose()
  renderer?.dispose()
  renderer?.domElement.remove()
  roots.clear()
})
</script>

<template>
  <div ref="host" class="hero-scene" aria-hidden="true">
    <p v-if="failed.length" class="scene-error t-mono-xs">
      MODEL_NOT_FOUND:<br />
      <span v-for="url in failed" :key="url">{{ url }}<br /></span>
    </p>
  </div>
</template>

<style scoped>
.hero-scene {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.scene-status {
  position: absolute;
  bottom: 16px;
  right: 16px;
  margin: 0;
  padding: 4px 8px;
  color: #7fe3e3;
  background: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.08em;
}

.scene-error {
  position: absolute;
  bottom: 16px;
  left: 16px;
  margin: 0;
  padding: 4px 8px;
  color: #ffd7d3;
  background: rgba(140, 0, 0, 0.55);
  border: 1px solid #ff8a80;
}
</style>
