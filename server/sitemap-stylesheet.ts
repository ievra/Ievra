// XSLT stylesheet that renders /sitemap.xml as a human-friendly page in the
// browser. Crawlers (Googlebot, etc.) ignore the stylesheet and read the raw
// XML, so SEO is unaffected. Served at /sitemap.xsl and referenced from the
// sitemap via an <?xml-stylesheet?> processing instruction.
export const SITEMAP_XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="vi">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>IEVRA — Sitemap</title>
        <style>
          :root { color-scheme: dark; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #0a0a0a;
            color: #e5e5e5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
          }
          .wrap { max-width: 1100px; margin: 0 auto; padding: 40px 24px 64px; }
          header { border-bottom: 1px solid #262626; padding-bottom: 24px; margin-bottom: 28px; }
          h1 { margin: 0 0 6px; font-size: 26px; font-weight: 700; letter-spacing: 0.04em; }
          h1 .brand { color: #c9a227; }
          .sub { color: #a3a3a3; font-size: 14px; }
          .count { display: inline-block; margin-top: 14px; background: #1a1a1a; border: 1px solid #2e2e2e; color: #c9a227; font-size: 13px; padding: 4px 12px; border-radius: 999px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          thead th {
            text-align: left; text-transform: uppercase; letter-spacing: 0.06em;
            font-size: 11px; color: #8a8a8a; font-weight: 600;
            padding: 10px 12px; border-bottom: 1px solid #2e2e2e;
          }
          tbody td { padding: 11px 12px; border-bottom: 1px solid #1a1a1a; vertical-align: top; }
          tbody tr:hover { background: #121212; }
          a { color: #d6b94a; text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .alt { display: inline-block; margin: 0 6px 4px 0; padding: 1px 7px; font-size: 11px; border-radius: 4px; background: #1a1a1a; border: 1px solid #2e2e2e; color: #b5b5b5; }
          .num { color: #6b6b6b; }
          .meta { color: #a3a3a3; white-space: nowrap; }
          footer { margin-top: 28px; color: #6b6b6b; font-size: 12px; }
          @media (max-width: 700px) { .hide-sm { display: none; } }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <h1><span class="brand">IEVRA</span> — Sitemap</h1>
            <div class="sub">Danh sách các đường dẫn của website cho công cụ tìm kiếm.</div>
            <div class="count"><xsl:value-of select="count(s:urlset/s:url)"/> đường dẫn</div>
          </header>
          <table>
            <thead>
              <tr>
                <th class="num">#</th>
                <th>URL</th>
                <th class="hide-sm">Ngôn ngữ thay thế</th>
                <th class="hide-sm">Cập nhật</th>
                <th class="hide-sm">Tần suất</th>
                <th>Ưu tiên</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td class="num"><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                  </td>
                  <td class="hide-sm">
                    <xsl:for-each select="xhtml:link">
                      <span class="alt"><xsl:value-of select="@hreflang"/></span>
                    </xsl:for-each>
                  </td>
                  <td class="hide-sm meta"><xsl:value-of select="s:lastmod"/></td>
                  <td class="hide-sm meta"><xsl:value-of select="s:changefreq"/></td>
                  <td class="meta"><xsl:value-of select="s:priority"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
          <footer>Sitemap được tạo tự động · Định dạng XML chuẩn cho công cụ tìm kiếm.</footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;
