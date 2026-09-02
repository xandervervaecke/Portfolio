/**
 * ============================================================================
 *  HERO SCENE — every number you might want to move lives in this file.
 * ============================================================================
 *
 *  The scene is an office: you at a desk, typing. Scroll / space / the boot
 *  button plays the "spinning" clip, the chair swings round, and the portfolio
 *  opens when that finishes.
 *
 *  Models are read straight out of the repo-root  models/  folder —
 *  vite.config.ts mounts it at  /models , so `url: '/models/foo.glb'` means
 *  `<repo>/models/foo.glb`. (`models/trash/` is deliberately not served.)
 *
 *  FINDING THE CAMERA
 *  ------------------
 *  Leave `debug.camera` on, run the dev server, and orbit/pan/zoom with the
 *  mouse. Every second the console prints a ready-made `camera` block — paste
 *  it over the one below, then set `debug.camera` to false. Do turn it off
 *  before you deploy: while it is on, the wheel zooms instead of opening the
 *  portfolio, and the console gets a line every second.
 *
 *  EXPORTING FROM BLENDER — read this before adding a model
 *  --------------------------------------------------------
 *  Prefer **glTF Binary (.glb)**. It packs mesh, skeleton, animation AND
 *  textures into one file, which is why xander.glb worked immediately while
 *  every .fbx here needed its textures hunted down by hand.
 *      File > Export > glTF 2.0
 *      Format: glTF Binary (.glb)
 *      Include > check Selected Objects if you are exporting one character
 *      Data > Mesh: UVs + Normals;  Data > Material: Export
 *      Animation: on (Sampling keeps the motion exactly as played)
 *
 *  If it has to be .fbx, the one setting that matters is in the export
 *  sidebar under **Path Mode**:
 *      Path Mode: Copy   +   click the "Embed Textures" box icon beside it
 *  Without that, FBX writes only an absolute path to wherever the images sat
 *  on the exporting machine (C:\Users\...\Downloads\textures\packed\...), which
 *  nothing on the web can follow. Every .fbx in models/ was exported this way,
 *  which is why they arrive untextured.
 *
 *  Either way the texture has to be a real Image Texture node wired into Base
 *  Color. Procedural materials and viewport-only colours export as nothing —
 *  bake them to an image first (Render Properties > Bake) and wire that in.
 *
 *  When a model carries its own textures they load automatically and need no
 *  `textures` mapping below; the dev console names any that were guessed.
 *
 *  TUNING ANIMATION SPEED
 *  ----------------------
 *  `animation.typing.speed` / `animation.spin.speed` — 1 is the authored speed,
 *  0.5 is half, 2 is double. Live, without a reload:
 *      __hero.speed('typing', 0.6)
 *      __hero.speed('spin', 1.4)
 *      __hero.play()    // run the exit animation without opening the desktop
 *      __hero.reset()   // back to typing, chair straight
 *      __hero.roots     // the loaded models, keyed as below, for live nudging
 */

export type Vec3 = [number, number, number]

export interface ModelSpec {
  /** Handle used in code (`chair` and `character` are wired to behaviour). */
  key: string
  /** Served path. Anything in the repo-root models/ folder is at /models/… */
  url: string
  /** Flip to false to leave it out of the scene entirely (nothing downloads). */
  enabled: boolean
  position: Vec3
  /** Degrees, XYZ. Friendlier than radians when you are eyeballing a layout. */
  rotationDeg: Vec3
  /** Uniform scale. FBX out of Blender/Mixamo is usually ~0.01 of GLB scale. */
  scale: number
  castShadow?: boolean
  receiveShadow?: boolean
  /**
   * Loaded and measured but not drawn. Useful for geometry that is only there
   * as a reference — roof.glb exists to say where the ceiling is, not to be
   * seen. It still loads, so its bounds stay available.
   */
  visible?: boolean
  /**
   * Multiplies the base colour of every material in the model. Keeps textures,
   * so a light carpet map tinted dark brown still reads as carpet. Use
   * `fallbackColor` instead when a model has no usable texture at all.
   */
  color?: string
  /**
   * Some FBX files point at textures that only ever existed on the machine
   * that exported them. Give those a flat colour instead of default white.
   * Drop the real texture into  models/textures/  and it wins over this.
   */
  fallbackColor?: string
  /**
   * Explicit texture mapping, for files that name their textures in a way no
   * rule can resolve. The key is exactly what the model asks for (an FBX often
   * stores a bare glTF-import name like "Image_0", with no extension at all);
   * the value is a served path. Anything not listed still falls back to
   * looking the bare filename up in  models/textures/ .
   */
  textures?: Record<string, string>
  /** Roughness/metalness nudge applied to every material in the model. */
  roughness?: number
  metalness?: number
  /**
   * Loop a clip out of this model's own file, forever. Any model that ships
   * animation can have one — the character is the exception, not the rule:
   * it gets the typing/spinning pair under `animation` below instead.
   *
   * `clip`  name to play; omit it (or name one that turns out not to move) and
   *         whichever clip in the file does have motion is used instead.
   * `speed` 1 is as authored.
   * `loop`  'repeat' restarts from the top, which snaps if the last pose does
   *         not match the first. 'pingpong' plays it forwards then backwards,
   *         so it always joins up — useful for a clip exported with only its
   *         two end keyframes.
   */
  idle?: {
    clip?: string
    speed?: number
    loop?: 'repeat' | 'pingpong'
    /**
     * Blender tends to export a rest-pose key at frame 0, which shows up as a
     * T-pose flash on every loop. On by default: if the first keyframe sits on
     * the bind pose it is dropped. Set false to play the clip exactly as
     * authored.
     */
    trimRestPose?: boolean
  }
}

export const sceneConfig = {
  /* --- debug ------------------------------------------------------------ */
  debug: {
    /**
     * ON: orbit controls are live, the camera position is logged every second
     * and scroll-to-open is suspended so the wheel can zoom.
     * OFF: the camera sits exactly where `camera` says, with a little parallax.
     */
    camera: false,
    /** How often the camera block is printed, in milliseconds. */
    logEveryMs: 1000,
    /** Little wireframe markers showing where each light actually is. */
    lightHelpers: false,
  },

  /* --- camera ----------------------------------------------------------- */
  camera: {
    position: [7.04, 4.33, -1.75] as Vec3,
    /** The point it looks at — roughly the desk. */
    target: [2.87, 3.55, 2.06] as Vec3,
    fov: 38,
    near: 0.05,
    far: 400,
    /**
     * How far the camera drifts with the cursor. 0 pins it dead still, which
     * also means no pointermove listener is attached at all.
     */
    parallax: 0,
  },

  /* --- renderer --------------------------------------------------------- */
  render: {
    /**
     * The sky beyond the room — visible across the top where the roof is
     * hidden, and through the doorway. `backgroundImage` wins once it loads;
     * this colour shows until then, and if the image ever fails.
     *
     * Six-digit hex only — THREE.Color rejects '#rrggbbaa' and silently
     * leaves the colour white.
     */
    background: '#16130f',
    /**
     * Photo backdrop behind the scene. Stretched to the canvas, so busy images
     * distort — sky and other soft content survives it best. null for the
     * flat colour above.
     */
    backgroundImage: '/images/background2.jpg' as string | null,
    /**
     * Warm haze so the far end of the office falls away.
     * `enabled: false` switches it off entirely.
     */
    fog: { enabled: true, color: '#16130f', near: 18, far: 65 },
    /** Overall brightness. Nudge in 0.05 steps. */
    exposure: 0.88,
    /**
     * A neutral room reflection, so metal and gloss have something to catch.
     * It also lifts everything a little, which is most of why the room reads
     * as lit rather than as one lamp in a void.
     */
    environmentIntensity: 0.16,
    shadows: true,
    /** Shadow map resolution, per shadow-casting light. */
    shadowMapSize: 2048,
    /**
     * Blur radius on the shadow edges. Higher is softer — which is what you
     * want under a broad ambient fill, where a hard edge looks wrong.
     */
    shadowRadius: 4,
    maxPixelRatio: 2,
  },

  /* --- materials -------------------------------------------------------- */
  materials: {
    /**
     * FBXLoader builds MeshPhongMaterial, and Phong takes the room reflection
     * at full strength (`reflectivity` defaults to 1) on top of its specular
     * highlight — which is why the .fbx cast came out looking like wet plastic
     * next to the .glb models. Converting them to MeshStandardMaterial fixes
     * the look and, as a bonus, makes the per-model `roughness`/`metalness`
     * below actually apply: Phong has no such properties, so setting them on
     * an unconverted material did nothing at all.
     *
     * Set false only if you want the raw Phong look back.
     */
    convertPhong: true,
    /**
     * Applied to every converted material unless the model overrides it.
     * 1 is fully matte; drop towards 0.6 for a slight sheen.
     */
    roughness: 0.95,
    /** Cloth and skin are not metal. Leave at 0 unless something should be. */
    metalness: 0,
    /**
     * How strongly converted materials pick up the room reflection. Low keeps
     * them matte even where the environment is bright.
     */
    envMapIntensity: 0.35,
  },

  /* --- models ----------------------------------------------------------- */
  /**
   * Everything in models/ (minus trash/). All dropped at the origin at their
   * native scale to start with — reposition as you go. `enabled: false` skips
   * the download, worth knowing: the full set is ~75 MB.
   */
  models: [
    {
      key: 'office',
      url: '/models/the_office.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      // The furniture has to cast, or nothing lands on the desks. It is 1900
      // meshes, but they only go through the one directional shadow pass.
      castShadow: true,
      receiveShadow: true,
    },
    {
      // Loaded but not drawn. Its only job is to say where the ceiling is
      // (y = 5.5), which is what the overhead lights are positioned against —
      // so it still has to load, it just never appears. `color` is kept for
      // when you want to see it: flip `visible` and it comes back dark brown.
      key: 'roof',
      url: '/models/roof.glb',
      enabled: true,
      visible: false,
      color: '#3a2a1d',
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: false,
      receiveShadow: false,
    },
    {
      // The window glass. Daylight is emitted from in front of it — see
      // lights.daylight, which is positioned from this model's bounds.
      key: 'windows',
      url: '/models/windows.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: false,
      receiveShadow: false,
    },
    {
      key: 'screens',
      url: '/models/screens.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
    },
    {
      // Swung round by `chairSpin` once the boot animation starts.
      key: 'chair',
      url: '/models/chair.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
    },
    {
      /*
       * You. Holds both clips: "typing" (always on) and "spinning" (the boot).
       *
       * This is the .glb, NOT xander_mib.fbx — that export lost its keyframes
       * (2 keys per track, and "typing" does not move a single one of its 198
       * tracks). The .glb has the real thing: 495 keys on typing, 687 on
       * spinning, and its texture baked in. It is 21 MB, which is the price.
       */
      key: 'character',
      url: '/models/xander.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
      roughness: 0.85,
    },
    {
      key: 'byte',
      url: '/models/byte.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
    },
    {
      key: 'suki',
      url: '/models/suki.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
    },
    {
      key: 'golf',
      url: '/models/golf.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
    },
    {
      /*
       * The .fbx, not the .glb: only the .fbx carries the baked standing pose
       * (the .glb has no animation either, so it lands in its bind pose).
       * Its two textures are the ones that were embedded in the .glb, pulled
       * out into models/textures/ under the names the .fbx asks for.
       */
      key: 'ryder',
      url: '/models/ryder.fbx',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 0.01,
      castShadow: true,
      receiveShadow: true,
      idle: { clip: 'typing', speed: 0.333, loop: 'repeat' },
    },
    {
      /*
       * The "wuzimu" model, exported as .glb with its texture embedded, so it
       * needs no `textures` mapping — the image travels inside the file.
       */
      key: 'tyler',
      url: '/models/tyler.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
      idle: { clip: 'typing.003', speed: 0.333, loop: 'repeat' },
    },
    {
      /*
       * Re-exported as .glb with her texture embedded and her animation intact
       * — the file carries everything, so nothing needs mapping by hand.
       */
      key: 'rebecca',
      url: '/models/rebecca.glb',
      enabled: true,
      position: [0, 0, 0],
      rotationDeg: [0, 0, 0],
      scale: 1,
      castShadow: true,
      receiveShadow: true,
      idle: { clip: 'typing.001', speed: 0.333, loop: 'repeat' },
    },
  ] as ModelSpec[],

  /* --- animation -------------------------------------------------------- */
  animation: {
    /** The idle loop. Runs from the moment the character lands in the scene. */
    typing: {
      /** Clip name inside the character file. As authored this one is 8.2s. */
      clip: 'typing',
      /** 1 = as authored. Lower is slower; this is a third of full speed. */
      speed: 0.333,
    },
    /**
     * Plays once when the visitor asks to come in.
     *
     * Note: "spinning" is 11.4s as authored, so at speed 1 the maxBootMs
     * ceiling below always cuts it off partway. Set speed to about 2.4 if you
     * want the clip to actually reach its end inside the 5s budget — or raise
     * maxBootMs and leave the visitor looking at it for longer.
     */
    spin: {
      clip: 'spinning',
      speed: 1,
    },
    /** Seconds spent blending typing into spinning. */
    crossfade: 0.25,
    /**
     * Hard ceiling on the boot sequence, in milliseconds. The portfolio opens
     * when "spinning" ends or when this runs out — whichever comes first.
     */
    maxBootMs: 3500,
  },

  /* --- chair swing ------------------------------------------------------ */
  chairSpin: {
    /** Seconds after the boot animation starts before the chair moves. */
    delay: 0.2,
    /** Seconds the swing itself takes. */
    duration: 2,
    /** Degrees around Y, added to the chair's configured rotation. */
    degrees: 125,
  },

  /* --- lighting ---------------------------------------------------------
   *
   * Measured off the roof.glb and windows.glb models rather than guessed:
   *   ceiling  y = 5.5     (48 of roof.glb's 52 verts sit on that plane)
   *   floor    y ~ 2.96
   *   windows  y 3.0 - 5.6, wrapping x -1.5 - 14.1 and z -8.5 - 8.3
   *   room     x -8 - 18,  z -8.6 - 9.1
   *   you sit at [4.1, 3.6, 0.8], reception is around [0.3, 3.6, 2.4]
   *
   * TUNING WITHOUT RELOADING (the scene is ~90 MB; do not reload per tweak):
   *   __hero.light('ceiling0', { intensity: 10, position: [4.3, 5.3, 0.9] })
   *   __hero.exposure(0.8)      overall brightness
   *   __hero.helpers(true)      markers so you can see where each light sits
   *   __hero.lights()           prints this whole block back, ready to paste
   */
  lights: {
    /** Warm ceiling bounce over a darker floor. The base level in the room. */
    hemi: { sky: '#ffd9a5', ground: '#3d2a1c', intensity: 0.8 },
    /** Flat, shadowless lift so nothing goes fully black. */
    ambient: { color: '#ffcf9c', intensity: 0.45 },
    /**
     * Daylight through the windows. The window band wraps most of the room, so
     * this comes in from outside and above rather than from one wall. Kept dim
     * on purpose — it is the room-wide shadow caster more than a light.
     * `shadowBounds` is the half-size of the area its shadow map covers.
     */
    daylight: {
      color: '#cfdcff',
      intensity: 0.45,
      position: [17, 12, -11] as Vec3,
      target: [4, 3.4, 1.5] as Vec3,
      castShadow: true,
      shadowBounds: 18,
    },
    /**
     * The overhead lights, sitting on the ceiling plane at y = 5.3 — just under
     * the roof at 5.5. Add or remove entries freely; each one becomes a light
     * named ceiling0, ceiling1 … for __hero.light().
     *
     * Only one of them casts: a point light shadow is six render passes, and
     * the daylight above already covers the room.
     */
    ceiling: [
      // Over your desk.
      {
        color: '#ffc98f',
        intensity: 22,
        distance: 13,
        decay: 2,
        position: [4.3, 5.3, 0.9] as Vec3,
        castShadow: true,
      },
      // Over reception.
      {
        color: '#ffc48c',
        intensity: 16,
        distance: 12,
        decay: 2,
        position: [0.6, 5.3, 2.4] as Vec3,
        castShadow: false,
      },
      // Down the far end, over the cabinets.
      {
        color: '#ffbe82',
        intensity: 14,
        distance: 13,
        decay: 2,
        position: [-0.4, 5.3, 6.6] as Vec3,
        castShadow: false,
      },
      // Mid-room, so the space between desk and reception is not a dead zone.
      {
        color: '#ffc48c',
        intensity: 12,
        distance: 12,
        decay: 2,
        position: [6.5, 5.3, 3.5] as Vec3,
        castShadow: false,
      },
    ],
    /**
     * The desk lamp — a small warm pool just above the desk surface, which is
     * what makes the corner you sit in read as cosy rather than strip-lit.
     */
    deskLamp: {
      color: '#ffab5e',
      intensity: 4,
      distance: 3.4,
      decay: 2,
      position: [4.5, 4.05, 1.5] as Vec3,
      castShadow: false,
    },
  },

  /* --- intro reveal ------------------------------------------------------ */
  /**
   * The office powering up. Plays when the scene first appears — the moment the
   * loading screen clears — and again each time you come back from the
   * portfolio window, so the room wakes up rather than just reappearing.
   * Set `enabled: false` to skip it entirely.
   */
  intro: {
    enabled: true,
    /**
     * Replay it on returning from the portfolio. Turn off to have the reveal
     * happen only once, on first load.
     */
    onReturn: true,
    /**
     * Seconds of full darkness before the first tube tries to strike. The
     * reveal previously began the instant the scene appeared; this is the
     * quarter-second of black in front of it.
     */
    dark: 0.25,
    /** Seconds between one tube striking and the next. */
    stagger: 0.34,
    /** Seconds the exposure takes to climb back to normal, after `dark`. */
    duration: 3.2,
  },

  /* --- the monitors ------------------------------------------------------ */
  /**
   * The screens are painted by a little canvas that fakes a desktop: windows
   * that drift and get dragged around, a cursor, a blinking caret. It is drawn
   * once per `fps` and used as both the colour and the emissive map, so the
   * monitors read as lit rather than as grey panels.
   *
   * Note that `emissive` only makes the screen itself look bright — three.js
   * emissive materials do not cast light on anything else. If you want the
   * monitor spill back on your face, that needs a small point light in front
   * of the screen, which is what the old screenGlow was doing.
   *
   * Heads up: from the current camera the monitor is hidden behind you — the
   * screen is at z 1.5, you are at z 0.8, and the camera looks from z -1.3.
   * Move the camera left/higher to bring it into shot.
   */
  screen: {
    enabled: true,
    /** Canvas resolution. Bigger costs more per redraw; 512x320 is plenty. */
    width: 512,
    height: 320,
    /** Redraws per second. The desktop drifts slowly, so this can stay low. */
    fps: 12,
    /** How hard the screen glows. Raise for a darker room. */
    emissiveIntensity: 1.6,
    /**
     * The monitor UVs run bottom-up, so the canvas needs turning over. This is
     * a mirror in V only — a 180 degree rotation would also mirror it left to
     * right, which puts the cascade and the taskbar on the wrong side.
     */
    flipY: true,
    /** Extra rotation on top, in degrees. Normally 0. */
    rotateDeg: 0,
    /** Desktop colours. */
    desktop: '#1b3a5c',
    accent: '#4ea6d8',
  },

}

export type SceneConfig = typeof sceneConfig
