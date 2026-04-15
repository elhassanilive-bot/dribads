'use client';

import { useState } from "react";

export default function DocViewer({ arText = "", enText = "" }) {
  const [lang, setLang] = useState("ar");
  const currentText = lang === "ar" ? arText : enText;
  const fallbackText = currentText || arText || enText || "لم يتم توفير المحتوى بعد.";
  const document = parseDocument(fallbackText);

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <LangButton active={lang === "ar"} onClick={() => setLang("ar")}>
          العربية
        </LangButton>
        <LangButton active={lang === "en"} onClick={() => setLang("en")}>
          English
        </LangButton>
      </div>

      <div className="rounded-[2rem] border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-[0_20px_60px_-25px_rgba(0,0,0,0.15)] overflow-hidden">
        {document.updated ? (
          <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-50 to-transparent dark:from-red-950/40 dark:to-transparent px-6 sm:px-8 py-4">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{document.updated}</p>
          </div>
        ) : null}

        <div className="px-6 sm:px-8 lg:px-10 py-8 sm:py-10 space-y-8">
          {document.title ? (
            <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-950 dark:text-white">
                {document.title}
              </h2>
            </div>
          ) : null}

          {document.nodes.map((node, index) => renderNode(node, index))}
        </div>
      </div>
    </div>
  );
}

function renderNode(node, index) {
  if (node.type === "heading") {
    return (
      <section key={index} className="space-y-3 pt-2">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white leading-tight">
          {node.text}
        </h3>
      </section>
    );
  }

  if (node.type === "subheading") {
    return (
      <h4
        key={index}
        className="text-xl sm:text-2xl font-extrabold text-red-700 dark:text-red-300 leading-tight pt-2"
      >
        {node.text}
      </h4>
    );
  }

  if (node.type === "list") {
    return (
      <ul key={index} className="space-y-3 pr-0 sm:pr-1">
        {node.items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-gray-700 dark:text-gray-200 leading-8">
            <span className="mt-3 h-2.5 w-2.5 rounded-full bg-red-600 dark:bg-red-400 shrink-0" />
            <span className="text-base sm:text-lg">{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={index} className="text-base sm:text-lg leading-8 text-gray-700 dark:text-gray-200">
      {node.text}
    </p>
  );
}

function parseDocument(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  let index = 0;
  let title = "";
  let updated = "";
  const nodes = [];

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  if (index < lines.length) {
    title = lines[index].trim();
    index += 1;
  }

  while (index < lines.length && !lines[index].trim()) {
    index += 1;
  }

  if (index < lines.length && isUpdatedLine(lines[index].trim())) {
    updated = lines[index].trim();
    index += 1;
  }

  while (index < lines.length) {
    if (!lines[index].trim()) {
      index += 1;
      continue;
    }

    const line = normalizeListMarker(lines[index].trim());

    if (isHeading(line)) {
      nodes.push({ type: "heading", text: line });
      index += 1;
      continue;
    }

    if (isSubheading(line)) {
      nodes.push({ type: "subheading", text: line.slice(0, -1) });
      index += 1;
      continue;
    }

    if (isListCandidate(line)) {
      const items = [];
      while (index < lines.length) {
        const current = lines[index].trim();
        if (!current) {
          index += 1;
          continue;
        }

        const normalized = normalizeListMarker(current);
        if (!isListCandidate(normalized)) {
          break;
        }

        items.push(normalized);
        index += 1;
      }

      if (items.length > 0) {
        nodes.push({ type: "list", items });
        continue;
      }
    }

    const paragraph = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current) {
        if (paragraph.length > 0) {
          index += 1;
          break;
        }
        index += 1;
        continue;
      }

      const normalized = normalizeListMarker(current);
      if (paragraph.length > 0 && (isHeading(normalized) || isSubheading(normalized) || isListCandidate(normalized))) {
        break;
      }

      paragraph.push(normalized);
      index += 1;
    }

    if (paragraph.length > 0) {
      nodes.push({ type: "paragraph", text: paragraph.join(" ") });
    }
  }

  return { title, updated, nodes };
}

function normalizeListMarker(text) {
  return text.replace(/^[-*]\s+/, "").trim();
}

function isUpdatedLine(text) {
  return /^(آخر تحديث|effective date|last updated)\s*:/i.test(text);
}

function isHeading(text) {
  return /^(\d+[\.\)](\d+[\.\)])*\s*|\d+\.\d+\s+|\d+\s*\.)/.test(text);
}

function isSubheading(text) {
  return text.endsWith(":");
}

function isListCandidate(text) {
  if (!text) {
    return false;
  }

  if (isHeading(text) || isSubheading(text) || isUpdatedLine(text)) {
    return false;
  }

  if (/^[-*]\s+/.test(text)) {
    return true;
  }

  if (/[.!?؟]$/.test(text)) {
    return false;
  }

  return text.length <= 90;
}

function LangButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 text-sm font-bold transition-colors ${
        active
          ? "bg-red-600 text-white hover:bg-red-700"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
