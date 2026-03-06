export const ROUTE_MAP = {
  about:     { en: '/about',     vi: '/gioi-thieu' },
  portfolio: { en: '/portfolio', vi: '/du-an' },
  blog:      { en: '/blog',      vi: '/tin-tuc' },
  lookup:    { en: '/lookup',    vi: '/tra-cuu' },
  contact:   { en: '/contact',   vi: '/lien-he' },
} as const;

type RouteKey = keyof typeof ROUTE_MAP;

export function getPath(key: RouteKey, language: string): string {
  return ROUTE_MAP[key][language === 'vi' ? 'vi' : 'en'];
}

export function getProjectPath(language: string, slug?: string | null, id?: string | null): string {
  const base = getPath('portfolio', language);
  if (slug) return `${base}/${slug}`;
  if (id) return `/project/${id}`;
  return base;
}

export function getArticlePath(language: string, slug?: string | null): string {
  const base = getPath('blog', language);
  if (slug) return `${base}/${slug}`;
  return base;
}

export function isRoutePath(location: string, key: RouteKey): boolean {
  const en = ROUTE_MAP[key].en;
  const vi = ROUTE_MAP[key].vi;
  if (en === '/' || vi === '/') {
    return location === en || location === vi;
  }
  return location.startsWith(en) || location.startsWith(vi);
}
