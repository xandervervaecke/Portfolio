import * as THREE from 'three'

/**
 * A fake desktop, painted onto a canvas and used as the monitors' texture.
 *
 * Windows drift, one of them gets "dragged" by the cursor, a caret blinks in
 * the text window and a progress bar creeps along. It is deliberately coarse —
 * on screen it is a few hundred pixels across a monitor in the middle distance,
 * so what reads is the movement and the glow, not the detail.
 *
 * The same texture is used as `map` and `emissiveMap`, which is what makes the
 * screens throw light into the room.
 */

export interface ScreenSimOptions {
  width: number
  height: number
  fps: number
  desktop: string
  accent: string
  flipY: boolean
}

interface Win {
  x: number
  y: number
  w: number
  h: number
  /** Drift velocity, in pixels per second. */
  vx: number
  vy: number
  title: string
  kind: 'text' | 'chart' | 'files' | 'code'
}

export class ScreenSim {
  readonly texture: THREE.CanvasTexture

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private opts: ScreenSimOptions
  private wins: Win[] = []
  private cursor = { x: 0, y: 0, tx: 0, ty: 0 }
  /** Index of the window the cursor is currently dragging, or -1. */
  private dragging = -1
  private dragFor = 0
  private time = 0
  private sinceDraw = 0

  constructor(opts: ScreenSimOptions) {
    this.opts = opts
    this.canvas = document.createElement('canvas')
    this.canvas.width = opts.width
    this.canvas.height = opts.height
    const ctx = this.canvas.getContext('2d')
    if (!ctx) throw new Error('ScreenSim: no 2d context')
    this.ctx = ctx

    const kinds: Win['kind'][] = ['code', 'chart', 'files', 'text']
    const titles = ['render.cpp', 'metrics', 'C:\\PROJECTS', 'notes.txt']
    for (let i = 0; i < 4; i++) {
      this.wins.push({
        x: 20 + i * 34,
        y: 26 + i * 22,
        w: opts.width * (0.4 + Math.random() * 0.16),
        h: opts.height * (0.34 + Math.random() * 0.16),
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 4,
        title: titles[i]!,
        kind: kinds[i]!,
      })
    }
    this.cursor.x = opts.width * 0.5
    this.cursor.y = opts.height * 0.5
    this.pickCursorTarget()

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.flipY = opts.flipY
    this.draw()
  }

  /** Advance and redraw at most `fps` times a second. */
  update(dt: number) {
    this.time += dt
    this.sinceDraw += dt
    const step = 1 / this.opts.fps
    if (this.sinceDraw < step) return
    this.sinceDraw = 0
    this.step(step)
    this.draw()
    this.texture.needsUpdate = true
  }

  dispose() {
    this.texture.dispose()
  }

  private pickCursorTarget() {
    const { width, height } = this.opts
    // Half the time, go grab a window title bar and drag it somewhere.
    if (Math.random() < 0.5) {
      const i = Math.floor(Math.random() * this.wins.length)
      const w = this.wins[i]!
      this.cursor.tx = w.x + w.w * 0.4
      this.cursor.ty = w.y + 6
      this.dragging = i
      this.dragFor = 1.5 + Math.random() * 2
    } else {
      this.cursor.tx = 20 + Math.random() * (width - 40)
      this.cursor.ty = 20 + Math.random() * (height - 40)
      this.dragging = -1
    }
  }

  private step(dt: number) {
    const { width, height } = this.opts

    // Cursor eases toward its target, then picks a new one.
    this.cursor.x += (this.cursor.tx - this.cursor.x) * Math.min(1, dt * 3.5)
    this.cursor.y += (this.cursor.ty - this.cursor.y) * Math.min(1, dt * 3.5)
    const reached = Math.hypot(this.cursor.tx - this.cursor.x, this.cursor.ty - this.cursor.y) < 3

    if (this.dragging >= 0) {
      // Carry the grabbed window along with the cursor.
      const w = this.wins[this.dragging]!
      w.x = this.cursor.x - w.w * 0.4
      w.y = this.cursor.y - 6
      this.dragFor -= dt
      if (this.dragFor <= 0) {
        this.cursor.tx = 20 + Math.random() * (width - 40)
        this.cursor.ty = 20 + Math.random() * (height - 40)
        this.dragging = -1
      }
    } else if (reached) {
      this.pickCursorTarget()
    }

    // Everything else drifts gently and bounces off the edges.
    for (let i = 0; i < this.wins.length; i++) {
      if (i === this.dragging) continue
      const w = this.wins[i]!
      w.x += w.vx * dt
      w.y += w.vy * dt
      if (w.x < 4 || w.x + w.w > width - 4) w.vx *= -1
      if (w.y < 18 || w.y + w.h > height - 22) w.vy *= -1
      w.x = Math.max(4, Math.min(width - w.w - 4, w.x))
      w.y = Math.max(18, Math.min(height - w.h - 22, w.y))
    }
  }

  /* --- painting ---------------------------------------------------------- */

  private draw() {
    const { ctx } = this
    const { width, height, desktop, accent } = this.opts

    const bg = ctx.createLinearGradient(0, 0, 0, height)
    bg.addColorStop(0, desktop)
    bg.addColorStop(1, '#0b1c2e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, width, height)

    for (const w of this.wins) this.drawWindow(w)

    this.drawTaskbar()
    this.drawCursor()
  }

  private drawWindow(w: Win) {
    const { ctx } = this
    const { accent } = this.opts
    const r = Math.round

    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(r(w.x) + 3, r(w.y) + 3, r(w.w), r(w.h))

    ctx.fillStyle = '#d8dde3'
    ctx.fillRect(r(w.x), r(w.y), r(w.w), r(w.h))

    // Title bar
    ctx.fillStyle = accent
    ctx.fillRect(r(w.x), r(w.y), r(w.w), 12)
    ctx.fillStyle = '#ffffff'
    ctx.font = '8px monospace'
    ctx.fillText(w.title, r(w.x) + 4, r(w.y) + 9)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ['#ffd75e', '#7ad17a', '#ff7a6e'][i]!
      ctx.fillRect(r(w.x + w.w) - 10 - i * 9, r(w.y) + 3, 6, 6)
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(r(w.x) + 3, r(w.y) + 15, r(w.w) - 6, r(w.h) - 18)
    ctx.clip()
    this.drawContents(w)
    ctx.restore()
  }

  private drawContents(w: Win) {
    const { ctx } = this
    const { accent } = this.opts
    const x = Math.round(w.x) + 6
    const y = Math.round(w.y) + 20
    const iw = Math.round(w.w) - 12

    if (w.kind === 'chart') {
      // Bars that breathe, so the window is never static.
      const n = 9
      const bw = iw / n - 2
      for (let i = 0; i < n; i++) {
        const h = (0.25 + 0.7 * Math.abs(Math.sin(this.time * 0.9 + i * 0.7))) * (w.h - 32)
        ctx.fillStyle = i % 3 === 0 ? accent : '#8fa8bd'
        ctx.fillRect(x + i * (bw + 2), y + (w.h - 30) - h, bw, h)
      }
      return
    }

    if (w.kind === 'files') {
      for (let i = 0; i < 5; i++) {
        const sel = Math.floor(this.time * 0.7) % 5 === i
        ctx.fillStyle = sel ? accent : '#c3cbd4'
        ctx.fillRect(x, y + i * 11, 8, 7)
        ctx.fillStyle = sel ? accent : '#6d7783'
        ctx.fillRect(x + 12, y + i * 11 + 2, iw * (0.4 + (i % 3) * 0.15), 3)
      }
      return
    }

    if (w.kind === 'code') {
      for (let i = 0; i < 8; i++) {
        const len = 0.25 + ((i * 37) % 60) / 100
        ctx.fillStyle = i % 4 === 0 ? accent : '#7d8894'
        ctx.fillRect(x, y + i * 9, iw * len, 3)
      }
      // A progress bar creeping along under the code.
      const p = (this.time * 0.18) % 1
      ctx.fillStyle = '#aab4bf'
      ctx.fillRect(x, y + 78, iw, 5)
      ctx.fillStyle = accent
      ctx.fillRect(x, y + 78, iw * p, 5)
      return
    }

    // text — lines plus a blinking caret
    let cx = x
    let cy = y
    for (let i = 0; i < 7; i++) {
      const len = 0.3 + ((i * 53) % 55) / 100
      ctx.fillStyle = '#6d7783'
      ctx.fillRect(x, y + i * 9, iw * len, 3)
      cx = x + iw * len + 2
      cy = y + i * 9
    }
    if (Math.floor(this.time * 2) % 2 === 0) {
      ctx.fillStyle = '#1b1f24'
      ctx.fillRect(cx, cy - 1, 2, 6)
    }
  }

  private drawTaskbar() {
    const { ctx } = this
    const { width, height, accent } = this.opts
    const h = 16
    ctx.fillStyle = '#20303f'
    ctx.fillRect(0, height - h, width, h)
    ctx.fillStyle = accent
    ctx.fillRect(4, height - h + 3, 26, 10)
    for (let i = 0; i < this.wins.length; i++) {
      ctx.fillStyle = i === this.dragging ? accent : '#3c5266'
      ctx.fillRect(36 + i * 44, height - h + 3, 40, 10)
    }
    // clock
    ctx.fillStyle = '#9fb4c6'
    ctx.font = '8px monospace'
    ctx.fillText('19:0' + (Math.floor(this.time / 6) % 10), width - 30, height - 5)
  }

  private drawCursor() {
    const { ctx } = this
    const x = Math.round(this.cursor.x)
    const y = Math.round(this.cursor.y)
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo(x + 1, y + 1)
    ctx.lineTo(x + 1, y + 13)
    ctx.lineTo(x + 4, y + 10)
    ctx.lineTo(x + 7, y + 15)
    ctx.lineTo(x + 9, y + 14)
    ctx.lineTo(x + 6, y + 9)
    ctx.lineTo(x + 10, y + 9)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + 12)
    ctx.lineTo(x + 3, y + 9)
    ctx.lineTo(x + 6, y + 14)
    ctx.lineTo(x + 8, y + 13)
    ctx.lineTo(x + 5, y + 8)
    ctx.lineTo(x + 9, y + 8)
    ctx.closePath()
    ctx.fill()
  }
}
