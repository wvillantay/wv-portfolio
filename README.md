# William Villantay — portfolio (prototype, first pass)

Vite · React 19 · Tailwind v4 · GSAP ScrollTrigger · Lenis. Dark system-style loader, pinned
scroll-scrubbed portrait hero, "SYSTEM PROFILE" handoff, stack / work / contact.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview
```

## How the hero works

- `src/sequence/createSequence.js` — the only thing that knows what the portrait *is*. It reads
  `public/sequence/manifest.json` and exposes `load(onProgress)`, `draw(ctx, progress, w, h)`,
  `frameIndex(progress)`. Supports `type: "frames"` (WebP folder) and `type: "video"`
  (single all-intra MP4/WebM scrubbed via `currentTime`).
- `src/components/Hero.jsx` — one GSAP master timeline pins the stage for 400 vh and scrubs it
  (`scrub: 0.6`). Units 0–3 drive the portrait (progress 0→1), the HUD copy and the name reveal;
  unit 3–4 is the handoff, during which the profile sheet (`-mt-[100vh]`, `z-20`) slides over
  the still-pinned stage while the stage scales to 0.92 and a dim overlay ramps 0 → 0.72
  (an opacity tween, deliberately not a `filter` tween — GSAP reads `filter: none` as
  `brightness(0)`, which snapped the stage to black).
- `src/components/Loader.jsx` — percentage is the real frame-preload progress; exits only when
  frames + fonts are in (min 1.4 s on screen).
- `src/lib/siteReady.js` — sections create their ScrollTriggers only after the hero pin is
  measured (otherwise their start positions ignore the pin spacer).
- `src/data/profile.js` — all copy, nav, skills, external links and project cards.

## Links, project actions and case studies

Everything is driven by `src/data/profile.js`; components only read from it. The facts in it
come from William's own descriptions and `WilliamResume2026-Updated.pdf` (shipped as
`public/resume/William-Villantay-Resume.pdf`) — nothing is invented; a field is `null` rather
than guessed.

- `links` — `github`, `linkedin`, `resume`, `email`. A `null` value **hides that action
  everywhere** (nav, mobile drawer, contact CTA row, footer), so nothing can render as a dead
  link. External links open in a new tab with `rel="noopener noreferrer"` (`EXT` in
  `src/components/ProfileLinks.jsx`). Desktop nav: GitHub + LinkedIn round icon buttons
  (`.icon-btn` — brighter border, faint cool glow), a small accent "Resume ↗" pill (`.btn-accent`),
  then Hire Me; the mobile drawer lists the same three under "Elsewhere".
- `profile.logo` — the wordmark, rendered verbatim by `Wordmark` in `ProfileLinks.jsx` (currently
  "WV // Portfolio"; the part after " // " is set in the quieter mono style; no period is added).
  Used top-left in the nav and in the footer; the person's name appears in the hero, the System
  Profile heading and the © line only.
- Section tones — `index.css` gives `#about` / `#stack` / `#work` / `#contact` slightly different
  base values (#08090b / #050506 / #0b0c0f / #050506) plus a very quiet accent wash under each
  header, so the page no longer reads as one continuous slab.
- `skills` — exactly the resume's three groups (Languages / Frameworks & Libraries / Data & Tools).
- `education` — the three resume entries, rendered at the bottom of the System Profile copy.
- `work[]` — one entry per project card. Each card is a plain `<article>`, not a link, with
  **View Project** (in-site case study) plus exactly one repository state derived from `repo`
  (`src/components/RepoState.jsx`):

  | `repo`        | card / case study action                       |
  |---------------|------------------------------------------------|
  | `'https://…'` | **GitHub ↗** (new tab)                          |
  | `'private'`   | non-link **Private Repository**                |
  | `'pending'`   | non-link **GitHub Coming Soon**                |
  | `null`        | nothing                                        |

  plus **Live Demo ↗** only when `demo` is a URL, and a subtle `demoNote` line (Pack Battles:
  "Demo available during interviews"). `featured: true` adds a "Featured" marker; `badge` adds a
  custom one (Parking: "2nd Place"). `earlier: true` moves a card out of the main grid into the
  compact **Earlier Engineering Work** block below it (case studies only, no repository state).
  Current states: Omen V private (the full working repo stays private — when the sanitized public
  showcase repo exists, put its URL in `repo`), Pack Battles private permanently + interview-demo
  note, Logistics OCR Extractor → github.com/wvillantay/logistics-ocr-extractor, Warehouse Vision
  Counter → github.com/wvillantay/warehouse-vision-counter, Portfolio Engine private, Parking
  Availability Prototype and Robotic Rover Arm `repo: null` + `earlier` (source no longer
  available, so nothing is claimed). The main grid is 2 columns from `md`, 3 from `lg`.
- `work[].study` — the case study content. `role`, `award`, `where`, `status`, `year` render
  only when set; `highlights` only when non-empty. `src/components/CaseStudy.jsx` renders it as
  a full-screen sheet over the page (`z-[90]`) so the pinned hero is never unmounted. Lenis is
  stopped while it is open and the sheet scrolls natively (`data-lenis-prevent`). ESC, the
  close button, "All projects" and the browser back button all close it.
- Routing: `src/lib/caseStudy.js` mirrors the open study to the URL as `#work/<slug>`
  (`pushState`), so a case study can be linked to directly and back/forward work; a `#work/<slug>`
  hash on a fresh load opens the sheet over the hero once the loader has finished, and closing it
  restores the section hash the URL had before.
- Section deep links (`src/lib/hashNav.js`): `/#work`, `/#profile` (alias of the `#about`
  element — the hero's handoff targets that id and the hero is frozen), `/#stack`, `/#contact`,
  `/#home`. The hash is captured at the very start of startup (`src/lib/initialHash.js`, the
  first import in `main.jsx`) and nothing scrolls to 0 when it is a deep link — not `main.jsx`,
  not `App`. The cold-load landing (`runColdDeepLink`) is idempotent and gated, in order, on: the
  loader being gone, Lenis existing and started, the hero pin measured (`whenSiteReady`),
  `ScrollTrigger.refresh()` with the final layout, and the target having a real, reachable
  layout position; it then jumps (offset by the fixed nav; the profile sheet lands exactly where
  its handoff over the hero completes) and verifies on the next frame, +300 ms and +1200 ms,
  correcting once if the section drifted more than 4 px — but only while the visitor has not
  interacted, so it never fights real scrolling. Loads without a hash keep the manual
  scroll-restoration behaviour and open on the hero at 0; unknown hashes are stripped. Same-page
  hash links (nav, hero CTAs, contact) are handled here rather than by Lenis' `anchors`: they ease
  with Lenis and push the hash, so back/forward move between sections (the browser's own fragment
  jump on traversal is undone and re-eased; leaving a case study via back never re-scrolls).
- Verifying which build is live: in DevTools, `document.documentElement.dataset.build` prints the
  build stamp (`BUILD` in `src/lib/initialHash.js`, currently `2026-09-18-v9.1-deeplink`) and,
  after a deep-linked load, `window.__wvDeepLink` reports `{ id, landed, corrections }`. If the
  stamp is missing the deployment is running an older bundle (check that new files under `src/lib/`
  were committed — a failed Vercel build keeps the previous deployment live).

The sequence in `public/sequence/` is the **real hero turn** (v3): 119 transparent RGBA WebP
frames cut from the generated `360 video.mp4` (raw frames 0–118, played in reverse), so scroll
progress 0 is a back-angled pose and progress 1 is the photograph. The frames contain only the
subject and its contact shadow. The studio backdrop is computed per pixel in floating point
and quantized with a ±1-level TPDF dither (`src/lib/backdrop.js`) into an offscreen canvas at
device resolution — CSS gradients band in 8-bit on dark ramps, so this is the only way to get a
truly smooth black. The `.hero-backdrop` CSS gradient remains only as the underlay for the
instant before the canvas paints.

`assets/make_turn.py` does, per frame: light chroma-weighted denoise → rembg alpha matte →
guided-filter alpha refinement (edges follow the image, no erosion) → 3-tap temporal alpha →
decontamination against a clean background plate, with core-inpainted colour only in the
softest fringe → subtle light wrap from the backdrop → 1920×1080, WebP q84 / alpha 92. The
final 5 frames cross-fade the subject interior into the **original photograph** — ghost-aware:
the photo is only blended where the frame already agrees with it, so the still-swinging
necklace and the last degrees of head turn stay the clip's pixels until they settle, affine-
registered to the clip's frame 0 and colour-matched *locally* (the low-frequency difference to
the clip's frame, computed from subject-core pixels, is added to the photo — so skin, shirt and
shading match the preceding frames region by region while fine detail stays the photo's),
gated by the photo's own matte — so the
held frame is the real photo at native detail. A blink in the source (raw 28–36) was replaced
with optical-flow interpolated frames. `assets/make_card.py` renders the System Profile card
from the same final-frame subject.

`manifest.pacing` shapes the scrub: `holdStart` 0.08 holds the opening pose, `easeIn` 1.3 /
`easeOut` 1.6 form a two-sided power ease through the turn, `holdEnd` 0.18 holds the final
photograph. `"pacing": null` gives a linear mapping. `history.scrollRestoration` is set to
`manual` in `main.jsx` so every visit opens on frame 0.

## Regenerating or swapping the sequence

Replace `public/sequence/frame_*.webp` + `poster.webp` and edit `manifest.json`:

```json
{
  "type": "frames",
  "placeholder": false,
  "count": 150,
  "pattern": "/sequence/frame_{index}.webp",
  "pad": 4,
  "width": 1920, "height": 1080,
  "alpha": true,
  "poster": "/sequence/poster.webp",
  "focal": { "x": 0.5, "y": 0.32 },
  "pacing": { "holdStart": 0.08, "easeIn": 1.3, "easeOut": 1.6, "holdEnd": 0.18 }
}
```

Nothing in the components changes. (`focal` is the cover-fit anchor used when the viewport
crops the 16:9 frame — 0.32 keeps the head in frame on phones.)

### Asset spec for the generated rotation

| | Requirement |
|---|---|
| Deliverable | **Preferred:** frame folder, `frame_0000.webp … frame_NNNN.webp` (zero-based, 4-digit), WebP lossy q≈80, sRGB, no alpha. **Also fine:** one MP4 — H.264 High, yuv420p, CRF 16–18, **all-intra (`-g 1`)**, no audio — or the raw generator MP4; I explode it with ffmpeg. |
| Count / duration | 120 frames minimum (5 s @ 24 fps); **150 preferred** (5 s @ 30 fps or ~6 s @ 24). The scrub spans 300 vh, so 120–160 frames ≈ one frame per 20–25 px of scroll. |
| Resolution | **1920×1080** master. 1280×720 is acceptable for a prototype (site upsamples); a 1280×720 mobile set is derived automatically later. |
| Aspect | **16:9 landscape**, camera locked (no zoom, dolly, or pan). Subject centred; head top ≥ 8 % from the top edge; chest/waist crop at the bottom. Keep the subject inside the central **45 % of the width** — phones crop 16:9 down to ~9:19.5 around `focal`. |
| Start pose (frame 0) | Turned away, roughly **120–135° from camera** — back of the head and the far shoulder visible (the reference's first screenshot). |
| End pose (last frame) | **10–15° off frontal**, eyes to camera — angled, not dead-on. Hold the final pose for the last ~8 % of frames. |
| Motion | One smooth continuous turn at constant angular speed with a short ease at both ends. No arm/hand movement, no expression change beyond a slight smile at the end, no head bob. |
| Look | Lighting, background, wardrobe and framing **constant across every frame** — use `assets/hero_still_1920.png` (the treated studio still) as the generator's source/first frame so the backdrop matches the site. Photoreal; no stylisation. |
| Identity trick | Generate the turn **away** from the treated still ("subject slowly turns away from camera") and I reverse the frame order — the scroll end then lands on the untouched photo, and any drift only accumulates toward the back-of-head start, where the face isn't visible. |

Explode a video into frames:

```bash
ffmpeg -i turn.mp4 -vf "reverse,scale=1920:1080:flags=lanczos" -c:v libwebp -quality 80 -start_number 0 public/sequence/frame_%04d.webp
```

(drop `reverse,` if the clip already runs away→front.)

## Assets

`../wv-portfolio-assets/` holds the pipeline: `make_still.py` (rembg cutout → studio composite,
profile card) and `make_sequence.py` (the earlier placeholder), and `make_turn.py` (the real turn: video -> mattes -> plate -> composite -> WebP frames + manifest).
