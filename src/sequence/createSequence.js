/**
 * Portrait sequence adapter.
 *
 * The hero only ever talks to the object returned by `createSequence()`:
 *
 *   const seq = createSequence(manifest)
 *   await seq.load(onProgress)          // 0..1
 *   seq.draw(ctx, progress, cw, ch)     // progress 0..1, cover-fit with focal point
 *   seq.frameIndex(progress) -> int     // for the HUD counter
 *   seq.count                           // frames (or virtual frames for video)
 *   seq.poster                          // HTMLImageElement, available immediately after loadPoster()
 *
 * Two sources are supported, selected by manifest.type:
 *   "frames" — /sequence/frame_0001.webp … (what the placeholder uses, and what a
 *              generated turntable exploded with ffmpeg should use)
 *   "video"  — a single all-intra MP4/WebM scrubbed via currentTime. Only use this
 *              with `-g 1` encodes; seeking is otherwise bound to keyframe spacing.
 *
 * Swapping the placeholder for the real turntable = replacing /public/sequence/* and
 * keeping the manifest keys. Nothing in the components changes.
 */

function drawCover(ctx, src, sw, sh, cw, ch, fx = 0.5, fy = 0.5) {
  const s = Math.max(cw / sw, ch / sh)
  const dw = sw * s
  const dh = sh * s
  const dx = (cw - dw) * fx
  const dy = (ch - dh) * fy
  ctx.drawImage(src, dx, dy, dw, dh)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      // decode() warms the bitmap so the first draw doesn't stall on the main thread
      if (img.decode)
        img
          .decode()
          .then(() => resolve(img))
          .catch(() => resolve(img))
      else resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function framePath(manifest, i) {
  const idx = String(i).padStart(manifest.pad ?? 4, '0')
  return manifest.pattern.replace('{index}', idx)
}

/**
 * Scroll progress -> timeline progress.
 *   holdStart  fraction of the scrub that holds the opening pose
 *   holdEnd    fraction that holds the final frame
 *   easeIn / easeOut  exponents of a two-sided power ease between the holds:
 *                     f(q) = q^in / (q^in + (1-q)^out) — >1 on either side softens that end
 * With no `pacing` in the manifest the mapping is linear.
 */
export function makePacing(pacing) {
  const hs = Math.min(Math.max(pacing?.holdStart ?? 0, 0), 0.5)
  const he = Math.min(Math.max(pacing?.holdEnd ?? 0, 0), 0.5)
  const kin = pacing?.easeIn ?? 1
  const kout = pacing?.easeOut ?? 1
  const span = Math.max(1 - hs - he, 0.05)
  return (p) => {
    const q = (Math.min(Math.max(p, 0), 1) - hs) / span
    if (q <= 0) return 0
    if (q >= 1) return 1
    const a = Math.pow(q, kin)
    const b = Math.pow(1 - q, kout)
    return a / (a + b)
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

/* ------------------------------------------------------------------ frames */
function createFrameSequence(manifest) {
  const count = manifest.count
  const frames = new Array(count).fill(null)
  const fx = manifest.focal?.x ?? 0.5
  const fy = manifest.focal?.y ?? 0.5
  const pace = makePacing(manifest.pacing)
  let poster = null

  return {
    type: 'frames',
    count,
    get poster() {
      return poster
    },
    get isPlaceholder() {
      return !!manifest.placeholder
    },
    /** true when frames are transparent cutouts and the page supplies the backdrop */
    get hasAlpha() {
      return !!manifest.alpha
    },

    async loadPoster() {
      if (!poster && manifest.poster) poster = await loadImage(manifest.poster)
      return poster
    },

    async load(onProgress) {
      let done = 0
      await mapWithConcurrency(
        Array.from({ length: count }, (_, i) => i),
        8,
        async (i) => {
          frames[i] = await loadImage(framePath(manifest, i))
          done += 1
          onProgress?.(done / count, done, count)
        },
      )
      return this
    },

    frameIndex(progress) {
      return Math.round(pace(progress) * (count - 1))
    },

    draw(ctx, progress, cw, ch) {
      const i = this.frameIndex(progress)
      // fall back to the nearest loaded frame (or the poster) while loading
      let img = frames[i]
      if (!img) {
        for (let d = 1; d < count && !img; d++) img = frames[i - d] || frames[i + d]
      }
      img = img || poster
      if (!img) return false
      drawCover(ctx, img, img.naturalWidth, img.naturalHeight, cw, ch, fx, fy)
      return true
    },
  }
}

/* ------------------------------------------------------------------- video */
function createVideoSequence(manifest) {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = manifest.src
  const fx = manifest.focal?.x ?? 0.5
  const fy = manifest.focal?.y ?? 0.5
  const virtualCount = manifest.count ?? 120
  const pace = makePacing(manifest.pacing)
  let poster = null
  let ready = false
  let lastT = -1

  return {
    type: 'video',
    count: virtualCount,
    get poster() {
      return poster
    },
    get isPlaceholder() {
      return !!manifest.placeholder
    },
    get hasAlpha() {
      return false
    },

    async loadPoster() {
      if (!poster && manifest.poster) poster = await loadImage(manifest.poster)
      return poster
    },

    load(onProgress) {
      return new Promise((resolve, reject) => {
        const tick = () => {
          if (video.buffered.length && video.duration) {
            const p = video.buffered.end(video.buffered.length - 1) / video.duration
            onProgress?.(Math.min(p, 0.99))
          }
        }
        video.addEventListener('progress', tick)
        video.addEventListener(
          'canplaythrough',
          () => {
            ready = true
            onProgress?.(1)
            resolve(this)
          },
          { once: true },
        )
        video.addEventListener('error', () => reject(new Error('video failed')), { once: true })
        video.load()
      })
    },

    frameIndex(progress) {
      return Math.round(pace(progress) * (virtualCount - 1))
    },

    draw(ctx, progress, cw, ch) {
      if (!ready) {
        if (poster) drawCover(ctx, poster, poster.naturalWidth, poster.naturalHeight, cw, ch, fx, fy)
        return !!poster
      }
      const t = pace(progress) * Math.max(video.duration - 0.05, 0)
      if (Math.abs(t - lastT) > 1 / 60) {
        video.currentTime = t
        lastT = t
      }
      drawCover(ctx, video, video.videoWidth, video.videoHeight, cw, ch, fx, fy)
      return true
    },
  }
}

export function createSequence(manifest) {
  if (manifest.type === 'video') return createVideoSequence(manifest)
  return createFrameSequence(manifest)
}

export async function fetchManifest(url = '/sequence/manifest.json') {
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`manifest ${res.status}`)
  return res.json()
}
