function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("mailto:")) return raw;
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  return "";
}

function renderInline(text) {
  let out = escapeHtml(text);

  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const href = safeUrl(url);
    if (!href) return escapeHtml(`![${alt}](${url})`);
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  });

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const href = safeUrl(url);
    if (!href) return escapeHtml(`[${label}](${url})`);
    const target = href.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHtml(href)}"${target}>${escapeHtml(label)}</a>`;
  });

  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return out;
}

export function renderMarkdownToHtml(markdown) {
  const src = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!src) return "";

  const lines = src.split("\n");
  let html = "";

  let inCode = false;
  let codeBuffer = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;
  let paragraph = [];

  function closeParagraph() {
    if (!paragraph.length) return;
    html += `<p>${renderInline(paragraph.join(" "))}</p>`;
    paragraph = [];
  }

  function closeLists() {
    if (inUl) {
      html += "</ul>";
      inUl = false;
    }
    if (inOl) {
      html += "</ol>";
      inOl = false;
    }
  }

  function closeQuote() {
    if (inQuote) {
      closeParagraph();
      html += "</blockquote>";
      inQuote = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
        codeBuffer = [];
        inCode = false;
      } else {
        closeQuote();
        closeLists();
        closeParagraph();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeQuote();
      closeLists();
      closeParagraph();
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      closeLists();
      if (!inQuote) {
        closeParagraph();
        html += "<blockquote>";
        inQuote = true;
      }
      paragraph.push(quoteMatch[1]);
      continue;
    }

    closeQuote();

    const hMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (hMatch) {
      closeLists();
      closeParagraph();
      const level = hMatch[1].length;
      html += `<h${level}>${renderInline(hMatch[2])}</h${level}>`;
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      closeParagraph();
      if (inOl) {
        html += "</ol>";
        inOl = false;
      }
      if (!inUl) {
        html += "<ul>";
        inUl = true;
      }
      html += `<li>${renderInline(ulMatch[1])}</li>`;
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      closeParagraph();
      if (inUl) {
        html += "</ul>";
        inUl = false;
      }
      if (!inOl) {
        html += "<ol>";
        inOl = true;
      }
      html += `<li>${renderInline(olMatch[1])}</li>`;
      continue;
    }

    paragraph.push(trimmed);
  }

  if (inCode) {
    html += `<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`;
  }

  closeQuote();
  closeLists();
  closeParagraph();

  return html;
}

