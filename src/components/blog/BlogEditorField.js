"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderMarkdownToHtml } from "@/lib/blog/markdown";

function insertAround(text, selectionStart, selectionEnd, before, after) {
  const start = Math.max(0, selectionStart ?? 0);
  const end = Math.max(start, selectionEnd ?? start);
  const selected = text.slice(start, end) || "";
  const next = text.slice(0, start) + before + selected + after + text.slice(end);
  const nextCursor = start + before.length + selected.length + after.length;
  return { next, nextCursor };
}

function insertLinePrefix(text, selectionStart, selectionEnd, prefix) {
  const start = Math.max(0, selectionStart ?? 0);
  const end = Math.max(start, selectionEnd ?? start);
  const before = text.slice(0, start);
  const selected = text.slice(start, end) || "";
  const after = text.slice(end);
  const lines = (selected || "").split("\n").map((l) => (l.trim() ? `${prefix}${l}` : l));
  const replacement = lines.join("\n") || `${prefix}`;
  const next = before + replacement + after;
  const nextCursor = (before + replacement).length;
  return { next, nextCursor };
}

export default function BlogEditorField({ name = "content", storageKey = "Dribdo_blog_draft" }) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || "";
    } catch {
      return "";
    }
  });
  const [tab, setTab] = useState("write");
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {}
  }, [storageKey, value]);

  const previewHtml = useMemo(() => renderMarkdownToHtml(value), [value]);
  const wordCount = useMemo(() => {
    const words = value
      .replace(/[`*_>#\[\]\(\)!-]/g, " ")
      .trim()
      .split(/\s+/g)
      .filter(Boolean);
    return words.length;
  }, [value]);

  function apply(action) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const text = value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let result;
    switch (action) {
      case "bold":
        result = insertAround(text, start, end, "**", "**");
        break;
      case "italic":
        result = insertAround(text, start, end, "*", "*");
        break;
      case "code":
        result = insertAround(text, start, end, "`", "`");
        break;
      case "h2":
        result = insertLinePrefix(text, start, end, "## ");
        break;
      case "h3":
        result = insertLinePrefix(text, start, end, "### ");
        break;
      case "quote":
        result = insertLinePrefix(text, start, end, "> ");
        break;
      case "ul":
        result = insertLinePrefix(text, start, end, "- ");
        break;
      case "ol":
        result = insertLinePrefix(text, start, end, "1. ");
        break;
      case "link": {
        const url = prompt("ضع الرابط (https:// أو /path):");
        if (!url) return;
        result = insertAround(text, start, end, "[", `](${url})`);
        break;
      }
      case "image": {
        const url = prompt("ضع رابط الصورة (https:// أو /path):");
        if (!url) return;
        result = insertAround(text, start, end, "![", `](${url})`);
        break;
      }
      case "codeblock":
        result = insertAround(text, start, end, "```\n", "\n```");
        break;
      default:
        return;
    }

    setValue(result.next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.nextCursor, result.nextCursor);
    });
  }

  return (
    <div className="rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => apply("h2")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            H2
          </button>
          <button type="button" onClick={() => apply("h3")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            H3
          </button>
          <button type="button" onClick={() => apply("bold")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            عريض
          </button>
          <button type="button" onClick={() => apply("italic")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            مائل
          </button>
          <button type="button" onClick={() => apply("link")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            رابط
          </button>
          <button type="button" onClick={() => apply("image")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            صورة
          </button>
          <button type="button" onClick={() => apply("ul")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            قائمة
          </button>
          <button type="button" onClick={() => apply("ol")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            ترقيم
          </button>
          <button type="button" onClick={() => apply("quote")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            اقتباس
          </button>
          <button type="button" onClick={() => apply("code")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            كود
          </button>
          <button type="button" onClick={() => apply("codeblock")} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold">
            كتلة كود
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={tab === "write" ? "px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold" : "px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold"}
          >
            كتابة
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={tab === "preview" ? "px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold" : "px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-sm font-semibold"}
          >
            معاينة
          </button>
        </div>
      </div>

      <div className="p-4">
        <input type="hidden" name={name} value={value} />

        {tab === "write" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={16}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white leading-relaxed"
            placeholder={"اكتب المقال هنا بصيغة Markdown...\n\n## عنوان فرعي\nفقرة...\n- نقطة\n- نقطة\n\n> اقتباس\n\n[رابط](https://example.com)"}
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4">
            {value.trim() ? (
              <article
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-gray-600 dark:text-gray-400">لا يوجد محتوى للمعاينة بعد.</p>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div>عدد الكلمات: {wordCount}</div>
          <button
            type="button"
            onClick={() => {
              setValue("");
              try {
                localStorage.removeItem(storageKey);
              } catch {}
            }}
            className="hover:text-red-800 dark:hover:text-red-300"
          >
            مسح المسودة
          </button>
        </div>
      </div>
    </div>
  );
}

