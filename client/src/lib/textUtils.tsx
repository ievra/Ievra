// Utility functions for text formatting

/**
 * Parse text and convert *text* to bold formatting
 * Example: "This is *bold* text" -> "This is <strong>bold</strong> text"
 */
export function parseBoldText(text: string): JSX.Element[] {
  if (!text) return [];
  
  const parts: JSX.Element[] = [];
  const regex = /\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`} className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }
    parts.push(
      <strong key={`bold-${key++}`} className="font-semibold break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${key++}`} className="break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return parts;
}

/**
 * Parse markdown-like text to HTML.
 * Supports: **bold**, *italic*, ***bold+italic***, ~~strikethrough~~, `code`,
 * # headings, > blockquote, - lists, 1. ordered lists, --- hr, (image-url)
 */
export function parseBoldTextToHTML(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeList = () => {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  };

  const parseInline = (s: string): string => {
    s = s.replace(/\(([^)"'\s]+\.(?:png|jpg|jpeg|gif|webp|svg))\s+"([^"]*)"\)/gi,
      (_, url, caption) =>
        `<figure class="my-4"><img src="${url}" alt="${caption}" class="max-w-full h-auto rounded-lg" /><figcaption class="text-center text-sm text-white/50 italic mt-2">${caption}</figcaption></figure>`
    );
    s = s.replace(/\(([^)"'\s]+\.(?:png|jpg|jpeg|gif|webp|svg))\)/gi,
      '<img src="$1" alt="" class="max-w-full h-auto my-4 rounded-lg" />');
    s = s.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded text-sm font-mono">$1</code>');
    return s;
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (/^-{3,}$/.test(trimmed)) {
      closeList();
      out.push('<hr class="border-white/20 my-6" />');
      continue;
    }

    if (/^### /.test(raw)) {
      closeList();
      out.push(`<h3 class="text-xl font-light mt-5 mb-2">${parseInline(raw.slice(4))}</h3>`);
      continue;
    }

    if (/^## /.test(raw)) {
      closeList();
      out.push(`<h2 class="text-2xl font-light mt-6 mb-3">${parseInline(raw.slice(3))}</h2>`);
      continue;
    }

    if (/^# /.test(raw)) {
      closeList();
      out.push(`<h1 class="text-3xl font-light mt-8 mb-4">${parseInline(raw.slice(2))}</h1>`);
      continue;
    }

    if (/^> /.test(raw)) {
      closeList();
      out.push(`<blockquote class="border-l-4 border-white/30 pl-4 my-4 text-white/60 italic">${parseInline(raw.slice(2))}</blockquote>`);
      continue;
    }

    if (/^- /.test(raw)) {
      if (!inUl) {
        if (inOl) { out.push('</ol>'); inOl = false; }
        out.push('<ul class="list-disc pl-6 my-2 space-y-1">');
        inUl = true;
      }
      out.push(`<li>${parseInline(raw.slice(2))}</li>`);
      continue;
    }

    if (/^\d+\. /.test(raw)) {
      if (!inOl) {
        if (inUl) { out.push('</ul>'); inUl = false; }
        out.push('<ol class="list-decimal pl-6 my-2 space-y-1">');
        inOl = true;
      }
      out.push(`<li>${parseInline(raw.replace(/^\d+\. /, ''))}</li>`);
      continue;
    }

    closeList();

    if (trimmed === '') {
      out.push('<br />');
      continue;
    }

    if (/^\([^)"'\s]+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\s+"[^"]*")?\)$/.test(trimmed)) {
      out.push(parseInline(trimmed));
      continue;
    }

    out.push(`<p class="mb-3 leading-relaxed">${parseInline(raw)}</p>`);
  }

  closeList();
  return out.join('\n');
}

/**
 * Component wrapper for rendering text with bold formatting
 */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  return <span className={`break-words ${className || ''}`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{parseBoldText(text)}</span>;
}
