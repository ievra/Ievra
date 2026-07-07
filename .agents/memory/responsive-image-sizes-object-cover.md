---
name: Responsive image `sizes` with object-cover landscape-into-portrait cards
description: Why card `sizes` must exceed the CSS column width when a landscape image fills a portrait card via object-cover.
---

When a landscape image (e.g. 16:9) fills a portrait-ish card via `object-cover`,
the browser scales the image to cover the card *height*, so its rendered width
overflows far past the card's CSS column width. The `sizes` attribute must reflect
that larger rendered width, NOT the column width.

**Why:** Card image blur ("không được nét") on `/du-an` and `/tin-tuc` came from a
stale `sizes` (fixed `500px`/`600px`, or naive per-column `33vw`). The browser then
picked a too-small srcSet candidate and object-cover upscaled it. On a ~530x560
portrait card a 16:9 source is rendered ~997px CSS wide; at 2x DPR ~1994 device px
are needed, so you must request ~1920w — which `sizes="...50vw"` selects, but
`33vw` (the true column width) would not.

**How to apply:** For card grids where a wide image is cropped into a taller card
with object-cover, set `sizes` generously (e.g. `(max-width: 768px) 100vw, 50vw`)
rather than matching the column width. Accept the minor over-fetch; sharpness is the
user-visible win. Only the raw column width applies when image and card share the
same orientation (e.g. landscape image in a landscape 2-col card). Also eager-load
the first row of cards and give the card container a dark bg (`bg-zinc-900`) so
above-the-fold cards don't flash black while lazy images load.
