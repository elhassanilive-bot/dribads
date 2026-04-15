const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export function tokenizeTextWithLinks(input) {
  const text = String(input || "");
  if (!text) return [];

  const tokens = [];
  let lastIndex = 0;
  let match = URL_REGEX.exec(text);

  while (match) {
    const start = match.index;
    const end = URL_REGEX.lastIndex;
    const url = match[0];

    if (start > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, start) });
    }

    tokens.push({ type: "link", value: url });
    lastIndex = end;
    match = URL_REGEX.exec(text);
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  URL_REGEX.lastIndex = 0;
  return tokens;
}
