import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { storage } from "./storage";

const BOT_USER_AGENTS = /facebookexternalhit|facebookbot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|applebot|googlebot|bingbot|yandexbot|baiduspider|zalo|viber|line-|pinterest|tumblr/i;

function isBot(req: Request): boolean {
  const ua = req.headers["user-agent"] || "";
  return BOT_USER_AGENTS.test(ua);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function injectOgTags(
  html: string,
  tags: {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
  }
): string {
  const { title, description, image, url, type = "website", siteName = "IEVRA Design & Build" } = tags;

  const metaTags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:type" content="${escapeHtml(type)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(siteName)}" />`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : "",
    description ? `<meta property="og:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : "",
    image ? `<meta property="og:image:width" content="1200" />` : "",
    image ? `<meta property="og:image:height" content="630" />` : "",
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : "",
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    description ? `<meta name="twitter:description" content="${escapeHtml(description)}" />` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return html.replace(/<\/head>/, `    ${metaTags}\n  </head>`);
}

export function ogMiddleware(indexHtmlPath: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || !isBot(req)) {
      return next();
    }

    try {
      const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
      const currentUrl = `${baseUrl}${req.originalUrl}`;

      let html: string;
      try {
        html = await fs.promises.readFile(indexHtmlPath, "utf-8");
      } catch {
        return next();
      }

      let tags: Parameters<typeof injectOgTags>[1] | null = null;

      const projectMatch = req.path.match(/^\/(?:portfolio|du-an)\/([^/]+)$/);
      if (projectMatch) {
        const slug = projectMatch[1];
        try {
          const project = await storage.getProjectBySlug(slug);
          if (project) {
            const coverImages = Array.isArray(project.coverImages) ? project.coverImages : [];
            const galleryImages = Array.isArray(project.galleryImages) ? project.galleryImages : [];
            const firstImage =
              project.heroImage ||
              coverImages[0] ||
              galleryImages[0];
            tags = {
              title: `${project.title} | IEVRA Design & Build`,
              description:
                project.metaDescription ||
                project.description ||
                "Dự án thiết kế nội thất của IEVRA Design & Build",
              image: firstImage ? `${baseUrl}${firstImage}` : undefined,
              url: currentUrl,
              type: "article",
            };
          }
        } catch {}
      }

      const blogMatch = req.path.match(/^\/(?:blog|tin-tuc)\/([^/]+)$/);
      if (!tags && blogMatch) {
        const slug = blogMatch[1];
        try {
          const article = await storage.getArticleBySlug(slug);
          if (article) {
            tags = {
              title: `${article.title} | IEVRA Design & Build`,
              description:
                article.metaDescription ||
                article.excerpt ||
                "Bài viết từ IEVRA Design & Build",
              image: article.featuredImage ? `${baseUrl}${article.featuredImage}` : undefined,
              url: currentUrl,
              type: "article",
            };
          }
        } catch {}
      }

      if (!tags) {
        try {
          const s = await storage.getSettings();
          let ogImgUrl: string | undefined;
          if (s?.ogImageData && s.ogImageData.startsWith('data:')) {
            ogImgUrl = `${baseUrl}/api/og-image`;
          } else if (s?.ogImage) {
            ogImgUrl = s.ogImage.startsWith('http') ? s.ogImage : `${baseUrl}${s.ogImage}`;
          }
          tags = {
            title: s?.siteTitle || "IEVRA Design & Build",
            description: s?.metaDescription || "Thiết kế nội thất cao cấp - IEVRA Design & Build",
            image: ogImgUrl,
            url: currentUrl,
          };
        } catch {
          tags = {
            title: "IEVRA Design & Build",
            description: "Thiết kế nội thất cao cấp - IEVRA Design & Build",
            url: currentUrl,
          };
        }
      }

      html = injectOgTags(html, tags);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  };
}
