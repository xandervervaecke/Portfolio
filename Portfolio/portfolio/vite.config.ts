import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/** The folder above this app — where the content actually lives. */
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

/** Root folders served straight through as static content. */
const MOUNTS: Record<string, string> = {
  '/images': path.join(repoRoot, 'images'),
  '/files': path.join(repoRoot, 'files'),
  '/models': path.join(repoRoot, 'models'),
}

/** Loose files at the repo root, served under /cv/. */
const CV_FILES = [
  'CV_Xander_Vervaecke_Engels.pdf',
  'CV_Xander_Vervaecke_Nederlands.pdf',
]

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.ktx2': 'image/ktx2',
}

/** Never shipped: the models folder keeps its rejects in here. */
const MOUNT_SKIP = new Set(['trash'])

function copyDir(from: string, to: string) {
  if (!fs.existsSync(from)) return
  fs.cpSync(from, to, {
    recursive: true,
    filter: (src) => !MOUNT_SKIP.has(path.basename(src)),
  })
}

/**
 * Serves ../images, ../files, ../models and the root CV PDFs as if they lived in public/,
 * so the JSON data files at the repo root stay the single source of truth.
 * Dev serves them from disk; build copies them into dist/.
 */
function rootContent(): Plugin {
  return {
    name: 'portfolio-root-content',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0] ?? '')

        let file: string | null = null
        for (const [prefix, dir] of Object.entries(MOUNTS)) {
          if (!url.startsWith(prefix + '/')) continue
          const rest = url.slice(prefix.length + 1)
          const candidate = path.join(dir, rest)
          // Never let a crafted URL escape the mounted directory, and keep the
          // skipped folders unreachable in dev as well as in the build.
          const skipped = rest.split('/').some((seg) => MOUNT_SKIP.has(seg))
          if (candidate.startsWith(dir) && !skipped) file = candidate
          break
        }
        if (!file && url.startsWith('/cv/')) {
          const name = url.slice('/cv/'.length)
          if (CV_FILES.includes(name)) file = path.join(repoRoot, name)
        }

        if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          // Falling through to the SPA fallback would answer a missing model or
          // texture with index.html and a 200, which shows up as a silently
          // broken texture rather than an error. Say what actually happened.
          if (Object.keys(MOUNTS).some((prefix) => url.startsWith(prefix + '/'))) {
            res.statusCode = 404
            res.end('Not found: ' + url)
            return
          }
          return next()
        }

        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },

    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url))
      if (!fs.existsSync(dist)) return

      for (const [prefix, dir] of Object.entries(MOUNTS)) {
        copyDir(dir, path.join(dist, prefix.slice(1)))
      }

      // Jekyll skips files and folders that start with an underscore; the
      // marker turns it off for good on GitHub Pages.
      fs.writeFileSync(path.join(dist, '.nojekyll'), '')

      const cvDir = path.join(dist, 'cv')
      fs.mkdirSync(cvDir, { recursive: true })
      for (const name of CV_FILES) {
        const src = path.join(repoRoot, name)
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(cvDir, name))
      }
    },
  }
}

/**
 * Where the site will be served from.
 *
 *   /            local dev, and GitHub Pages once a custom domain is set
 *   /Portfolio/  GitHub Pages without a custom domain (project page)
 *
 * The deploy workflow sets BASE_PATH; every runtime asset URL goes through
 * src/lib/asset.ts, which puts this in front.
 */
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue(), vueDevTools(), rootContent()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('..', import.meta.url)),
    },
  },
  server: {
    fs: {
      // The JSON data files are imported from the folder above this app.
      allow: ['..'],
    },
  },
})
