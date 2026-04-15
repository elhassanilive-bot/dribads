const fs = require("fs");
const path = require("path");

const replacements = [
  [/text-blue-600/g, "text-red-700"],
  [/text-blue-700/g, "text-red-800"],
  [/text-blue-500/g, "text-red-600"],
  [/text-blue-400/g, "text-red-500"],
  [/hover:text-blue-600/g, "hover:text-red-700"],
  [/hover:text-blue-700/g, "hover:text-red-800"],
  [/hover:text-blue-400/g, "hover:text-red-500"],
  [/dark:text-blue-400/g, "dark:text-red-400"],
  [/dark:text-blue-300/g, "dark:text-red-300"],
  [/dark:hover:text-blue-300/g, "dark:hover:text-red-300"],
  [/bg-blue-600/g, "bg-red-700"],
  [/bg-blue-700/g, "bg-red-800"],
  [/bg-blue-500/g, "bg-red-600"],
  [/hover:bg-blue-700/g, "hover:bg-red-800"],
  [/hover:bg-blue-600/g, "hover:bg-red-700"],
  [/border-blue-500/g, "border-red-500"],
  [/dark:hover:bg-blue-600/g, "dark:hover:bg-red-700"],
  [/dark:hover:bg-blue-400/g, "dark:hover:bg-red-400"],
  [/from-blue-50/g, "from-red-50"],
  [/to-indigo-100/g, "to-rose-100"],
];

const exts = new Set([".js", ".jsx", ".ts", ".tsx", ".css", ".md", ".mjs"]);

function iterate(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      iterate(full);
      continue;
    }
    if (!exts.has(path.extname(entry.name).toLowerCase())) continue;
    let text = fs.readFileSync(full, "utf8");
    let updated = text;
    for (const [pattern, replacement] of replacements) {
      updated = updated.replace(pattern, replacement);
    }
    if (text !== updated) {
      fs.writeFileSync(full, updated, "utf8");
    }
  }
}

iterate(path.resolve("c:/dribdoweb/src"));
