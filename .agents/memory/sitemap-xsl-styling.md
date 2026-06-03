---
name: Sitemap XSL styling
description: Why the sitemap "shows an error" in the browser and how it's styled
---

# Sitemap renders an "error" in the browser

When a user reports `sitemap.xml` "displays an error" but the XML is actually valid, the culprit is almost always the browser's notice *"This XML file does not appear to have any style information…"*. Non-technical users read that as an error. It is NOT a real XML problem — verify with a strict parser first (e.g. `python3 -c "import xml.dom.minidom as m; m.parse('file')"`).

**Fix:** attach an XSLT stylesheet so the browser renders a human-friendly page. Crawlers ignore the stylesheet and read raw XML, so SEO is unaffected.

**How it's wired here:**
- `server/sitemap-stylesheet.ts` exports `SITEMAP_XSL` (XSLT 1.0, dark/gold IEVRA theme, table of URLs + hreflang + lastmod/changefreq/priority).
- `server/routes.ts` serves it at `GET /sitemap.xsl` with `Content-Type: text/xsl; charset=utf-8`.
- The `/sitemap.xml` route emits `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>` immediately after the XML declaration (before `<urlset>`).

**Gotchas:**
- The stylesheet PI must be same-origin and the XSL served with an XML/XSL content type, or the browser silently skips styling.
- Route ordering matters: Express sitemap/XSL routes must be registered before the Vite/static SPA catch-all (they are, via `registerRoutes` before vite setup), otherwise `/sitemap.xsl` returns `text/html` (index.html) and styling fails.
- After editing server files, the dev workflow may need a restart for routes to take effect.
