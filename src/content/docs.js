import fs from "fs";
import path from "path";

const docsDir = path.join(process.cwd(), "assets", "Docs");

function readDoc(name) {
  return {
    ar: readDocFile(name, "ar"),
    en: readDocFile(name, "en"),
  };
}

function readDocFile(name, lang) {
  const filePath = path.join(docsDir, `${name}_${lang}.txt`);
  if (!fs.existsSync(filePath)) {
    return { text: "", title: "", updated: "" };
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  const { title, updated } = extractTitleAndUpdated(raw);
  return { text: raw, title, updated };
}

function extractTitleAndUpdated(raw) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const title = lines[0] ?? "";
  const updatedLine =
    lines.find((line) => /(آخر تحديث|Effective date|Last updated)/i.test(line)) ?? "";
  return { title, updated: updatedLine };
}

export const docsContent = {
  about: readDoc("about"),
  privacyPolicy: readDoc("privacy_policy"),
  terms: readDoc("terms"),
  agreements: readDoc("agreements"),
  dmca: readDoc("dmca"),
};
