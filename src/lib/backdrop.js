/**
 * Studio backdrop, rendered once per viewport size into an offscreen canvas.
 *
 * Why not CSS gradients: browsers interpolate gradients in 8-bit, so a dark ramp that spans
 * only a few levels bands into visible steps no matter what is layered on top. Here every
 * pixel is computed in floating point from the same layer stack, then quantized with a
 * ±1-level triangular (TPDF) dither — the minimum noise that removes banding, invisible as
 * texture. Rendered at device resolution, so nothing is ever compressed or upscaled.
 *
 * Layers (top to bottom):  key spotlight behind head/shoulders · wide soft fill · faint cool
 * wash · floor sweep · base vertical gradient; vignette over everything.
 */

const BASE = [
  [0.0, 18, 18, 21],
  [0.46, 10, 10, 12],
  [1.0, 5, 5, 6],
]

// [cx, cy, rx, ry] in viewport fractions; stops: [t, r, g, b, alpha]
const LAYERS = [
  {
    c: [0.5, 1.08, 0.9, 0.42],
    stops: [
      [0, 28, 28, 32, 0.95],
      [0.66, 28, 28, 32, 0],
    ],
  },
  {
    c: [0.63, 0.58, 0.52, 0.44],
    stops: [
      [0, 24, 56, 62, 0.16],
      [0.7, 24, 56, 62, 0],
    ],
  },
  {
    c: [0.5, 0.36, 0.64, 0.58],
    stops: [
      [0, 72, 72, 80, 0.3],
      [0.72, 72, 72, 80, 0],
    ],
  },
  {
    c: [0.5, 0.33, 0.34, 0.4],
    stops: [
      [0, 138, 138, 148, 0.46],
      [0.32, 96, 96, 106, 0.26],
      [0.62, 44, 44, 50, 0.1],
      [0.82, 44, 44, 50, 0],
    ],
  },
]
const VIGNETTE = {
  c: [0.5, 0.5, 0.78, 0.88],
  stops: [
    [0.52, 0, 0, 0, 0],
    [1.0, 0, 0, 0, 0.6],
  ],
}

function stopsAt(stops, t) {
  if (t <= stops[0][0]) return stops[0]
  const last = stops[stops.length - 1]
  if (t >= last[0]) return last
  for (let i = 1; i < stops.length; i++) {
    const s1 = stops[i]
    if (t <= s1[0]) {
      const s0 = stops[i - 1]
      const u = (t - s0[0]) / (s1[0] - s0[0])
      return [
        t,
        s0[1] + (s1[1] - s0[1]) * u,
        s0[2] + (s1[2] - s0[2]) * u,
        s0[3] + (s1[3] - s0[3]) * u,
        s0[4] + (s1[4] - s0[4]) * u,
      ]
    }
  }
  return last
}

export function renderBackdrop(cssW, cssH, dpr) {
  const w = Math.max(1, Math.round(cssW * dpr))
  const h = Math.max(1, Math.round(cssH * dpr))
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const ctx = off.getContext('2d', { alpha: false })
  const img = ctx.createImageData(w, h)
  const d = img.data

  // per-row constants
  const baseRow = new Float32Array(h * 3)
  for (let y = 0; y < h; y++) {
    const s = stopsAt(
      BASE.map(([t, r, g, b]) => [t, r, g, b, 1]),
      y / (h - 1),
    )
    baseRow[y * 3] = s[1]
    baseRow[y * 3 + 1] = s[2]
    baseRow[y * 3 + 2] = s[3]
  }
  const layers = LAYERS.map((L) => ({
    cx: L.c[0] * w,
    cy: L.c[1] * h,
    rx: L.c[2] * w,
    ry: L.c[3] * h,
    stops: L.stops,
  }))
  const vig = {
    cx: VIGNETTE.c[0] * w,
    cy: VIGNETTE.c[1] * h,
    rx: VIGNETTE.c[2] * w,
    ry: VIGNETTE.c[3] * h,
    stops: VIGNETTE.stops,
  }

  let p = 0
  for (let y = 0; y < h; y++) {
    let r = 0
    let g = 0
    let b = 0
    for (let x = 0; x < w; x++) {
      r = baseRow[y * 3]
      g = baseRow[y * 3 + 1]
      b = baseRow[y * 3 + 2]
      for (let i = 0; i < layers.length; i++) {
        const L = layers[i]
        const dx = (x - L.cx) / L.rx
        const dy = (y - L.cy) / L.ry
        const t = Math.sqrt(dx * dx + dy * dy)
        if (t >= L.stops[L.stops.length - 1][0]) continue
        const s = stopsAt(L.stops, t)
        const a = s[4]
        if (a <= 0) continue
        r += (s[1] - r) * a
        g += (s[2] - g) * a
        b += (s[3] - b) * a
      }
      {
        const dx = (x - vig.cx) / vig.rx
        const dy = (y - vig.cy) / vig.ry
        const t = Math.sqrt(dx * dx + dy * dy)
        if (t > vig.stops[0][0]) {
          const s = stopsAt(vig.stops, Math.min(t, 1))
          const a = s[4]
          r += (0 - r) * a
          g += (0 - g) * a
          b += (0 - b) * a
        }
      }
      // legibility darkening (bottom for the name/labels, top for the nav) — computed here in
      // float so it is dithered too; the CSS overlays above the canvas are kept much weaker
      {
        const fy = y / (h - 1)
        const bottom = 0.9 * Math.max(0, (fy - 0.6) / 0.4)
        const top = 0.6 * Math.max(0, (0.24 - fy) / 0.24)
        const a = 1 - (1 - bottom) * (1 - top)
        r *= 1 - a
        g *= 1 - a
        b *= 1 - a
      }
      // TPDF dither: triangular noise in [-1, 1] levels, shared across channels so it stays neutral
      const n = Math.random() + Math.random() - 1
      d[p] = Math.max(0, Math.min(255, Math.round(r + n)))
      d[p + 1] = Math.max(0, Math.min(255, Math.round(g + n)))
      d[p + 2] = Math.max(0, Math.min(255, Math.round(b + n)))
      d[p + 3] = 255
      p += 4
    }
  }
  ctx.putImageData(img, 0, 0)
  return off
}
