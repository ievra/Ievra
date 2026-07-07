---
name: Typewriter cards must reserve fixed text slots
description: Card layouts that type text in (TypewriterTitle/TypewriterText) must reserve fixed heights or they reflow while typing.
---

Any card that animates text in character-by-character (the `TypewriterTitle` /
`TypewriterText` components in the homepage) must give each dynamic text block a
**fixed reserved height** (e.g. title = 2 lines via `height` + `lineHeight`,
excerpt = 3 lines in an always-present wrapper) — not rely on natural height.

**Why:** As the typewriter types, the text grows from empty → full (title 1→2
lines, excerpt appears then grows), which reflows the date, image and everything
below it. Users reported title/content/image "jumping" during the effect. Also,
using a fixed content-area height + `mt-auto` on the footer produced a large black
gap when content was short.

**How to apply:** Give the card a fixed outer height, let the image `flex:1` to
fill the space above the content, and inside the content give each dynamic text
block an explicit reserved height so the layout is constant regardless of typing
progress or active/inactive state. Reserve the excerpt slot even when it only
renders for the active card, so activating a card does not shift the image/date.
Avoid `mt-auto` footers inside an over-tall fixed content box.
