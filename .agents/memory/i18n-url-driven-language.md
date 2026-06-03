---
name: URL-driven language (Hướng A)
description: Why/how the active language is derived from the URL, not client toggle state
---

# URL-driven language for bilingual SEO (Hướng A)

The site keeps BOTH language URLs (EN: `/portfolio`, `/about`, `/blog`, `/contact`, `/lookup`; VI: `/du-an`, `/gioi-thieu`, `/tin-tuc`, `/lien-he`, `/tra-cuu`). Each page is self-canonical and cross-links via reciprocal hreflang (+ `x-default` pointing to VI).

**Rule:** the active language MUST derive from the URL on language-specific pages, never from a toggle/localStorage on those pages. `LanguageProvider` computes `urlLang` from the path (matching `ROUTE_MAP` base or `base + '/'` prefix) and uses `language = urlLang ?? preferred`. Neutral paths (`/`, `/admin`, `/project/:id`) fall back to the stored `localStorage('language')` preference. `setLanguage` only updates that stored preference.

**Why:** different languages are NOT duplicate content, so two URLs are fine for SEO. The real bug was the SPA deciding language from client state, so a single URL (e.g. `/du-an`) could render either language — that breaks the self-canonical/hreflang contract for crawlers. Driving language from the URL makes each URL deterministically one language.

**Why not VI-only:** an earlier request to collapse to VI-only slugs / remove `/portfolio` (called "Hướng B") was explicitly REVERSED by the user — they want English to rank too. Do not re-collapse the routes.

**How to apply:** when adding a new public route, add its EN/VI pair to `ROUTE_MAP` so language detection and the sitemap pick it up. The Layout language toggle navigates to the other-language URL on content pages (correct); on the homepage it just flips the stored preference. i18next/i18n libs do NOT generate canonical/hreflang — those come from the `usePageMeta` hook.
