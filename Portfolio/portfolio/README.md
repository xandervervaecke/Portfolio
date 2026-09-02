# PORTFOLIO_SYSTEM v1.0

Xander Vervaecke's portfolio — a Windows 95 desktop glued onto graph paper, built
with Vue 3 + Vite + TypeScript, with a full-screen Three.js hero in front of it.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run type-check
```

## How it behaves

1. The page opens on a **full-screen 3D scene** (the hero). Nothing scrolls — the
   hero owns the viewport.
2. **Scroll down, press Enter/Space/↓, or click `ENTER_PORTFOLIO.EXE`** → the
   Win95 window zooms open over the scene.
3. **Close (✕) or Minimise (—)** on the window's title bar → back to the 3D
   scene. Maximise (□) makes the window fill the screen.
4. Tabs live in the window's tab strip. The current tab is in the URL
   (`#/projects`), so links are shareable.

## Where to edit what

Everything except `site.ts` lives **one folder up**, in the repository root —
that is the single source of truth, and it is what the app reads.

| I want to change… | File |
| --- | --- |
| Projects (incl. favourites & tags) | `../projects.json` |
| Work experience | `../work.json` |
| Degrees & certifications | `../education.json` |
| Publications & papers | `../publications_papers.json` |
| Images | `../images/` |
| PDFs (thesis, articles) | `../files/` |
| CV PDFs | `../CV_Xander_Vervaecke_*.pdf` |
| Bio, lede, tech stack, contact details | `src/data/site.ts` |
| Colours, bevels, type, animations | `src/assets/win95.css` |

A small Vite plugin (`rootContent` in `vite.config.ts`) serves `../images` at
`/images`, `../files` at `/files` and the two root CV PDFs at `/cv`, in dev and
in the production build alike. Nothing is duplicated — edit the root files and
the site updates.

### Adding a project

```jsonc
{
  "id": "kebab-case-id",          // must be unique
  "title": "Project Title",
  "subtitle": "One line under the title",
  "favorite": true,                // ★ shows on the card + on the About tab
  "extracurricular": true,         // adds the yellow "Extracurricular" tag
  "tags": ["OpenGL", "Shaders"],   // free-form; the filter bar builds itself
  "year": 2026,                    // null sinks the card to the bottom
  "summary": "Short blurb for the card.",
  "description": "Longer text, only shown in the detail window.",
  "highlights": ["Bullet", "Bullet"],
  "technologies": ["C++", "GLSL"],
  "media": {
    "images": ["images/foo.png", "images/bar.png"],   // first one is the cover
    "imagefill": true,                                // see below
    "video": "https://youtu.be/VIDEOID",              // embedded automatically
    "pdf": [{ "src": "/files/paper.pdf", "label": "Read the paper" }]
  },
  "links": ["https://example.com"]
}
```

Ordering is not up to the JSON: cards are always sorted **favourites first,
then newest year first**, undated entries last. `favorite` is data-only — nobody
can star anything from the UI, and the star is hidden when `favorite` is false.

### `"imagefill": true`

By default a card's image is cropped to a tidy 4:3 frame. Set
`"imagefill": true` inside `media` and the frame takes the **image's own shape**
instead — the whole image shows, nothing cropped, no letterbox bands. Use it for
very wide or very tall images: `LieSpy.png` is 3.12:1 and `bapuhasselt.png` is
2.5:1, so both look wrong squeezed into 4:3.

It applies to the project card, the publication card and the detail window. On
the small favourite tiles on the About tab (a fixed grid) it keeps the tile size
and just stops cropping.

Media paths work with or without a leading slash (`images/x.png` and
`/images/x.png` both resolve to `../images/x.png`). Spaces in filenames are
escaped for you.

### Your portrait

The About tab currently shows a "PHOTO.BMP not found" frame. Drop a photo into
`../images/` and set it at the top of
`src/components/panes/HomePane.vue`:

```ts
const portrait: string | null = '/images/xander.jpg'
```

## The 3D hero

`src/components/HeroScene.vue` is fully wired — renderer, camera, lights, orbit
controls, DPR cap, resize handling, a render loop that pauses while the window
is open, and complete teardown on unmount — and deliberately **empty of
content**. Two ways to fill it:

**Drop in a model.** Put a `.glb` in `public/models/` and set it in
`src/data/site.ts`:

```ts
heroModel: '/models/my-thing.glb',
```

It gets centred, scaled to fit the frame and slowly rotated.

**Write your own scene.** Search `HeroScene.vue` for:

- `>>> YOUR SCENE GOES HERE <<<` — one-time setup; `scene`, `camera`,
  `renderer` and `controls` are in scope.
- `>>> YOUR PER-FRAME CODE GOES HERE <<<` — inside `tick()`, with `dt` (seconds
  since last frame) available.

Orbit controls are constructed but disabled (`controls.enabled = false`) so a
drag never fights the "scroll to open" gesture. Flip it to `true` once there is
something worth orbiting.

three.js is loaded as a separate async chunk, so it never blocks first paint.

## Structure

```
src/
  assets/win95.css          design system: tokens, bevels, chips, tape, animations
  components/
    Hero.vue                full-screen hero: nameplate, boot prompt, gestures
    HeroScene.vue           the Three.js canvas (empty, wired up)
    Desktop.vue             the main window: tab strip + active pane
    Win95Window.vue         reusable window chrome (title bar, sys buttons)
    DetailWindow.vue        the modal .DOC window for a project or publication
    ProjectCard.vue         polaroid card
    YouTubeEmbed.vue        click-to-load CRT-styled embed
    PixelIcon.vue           hand-rolled 16×16 pixel icons
    panes/                  HomePane, ProjectsPane, EducationPane, WorkPane
  composables/
    useDesktop.ts           open/close/minimise/maximise, active tab, URL hash
    useDetail.ts            the single detail window's state
  lib/content.ts            loads the JSON, sorts it, normalises media paths
  data/site.ts              bio, contact, CV links, hero model path
```

## Known follow-ups

- `site.contact.linkedin` is a guess — replace it with your real profile URL.
- The two CV PDFs are 24 MB and 46 MB. They ship as-is to anyone who clicks
  Download; worth compressing.
- `weather-photo-display` and `more-projects` have no images yet, so they render
  with the striped "no preview" placeholder.
