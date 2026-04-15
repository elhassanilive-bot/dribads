export function escapeCsv(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

export function escapePdfText(value) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildSimplePdf({ title, subtitle, lines }) {
  const contentLines = [];
  let y = 770;

  if (title) {
    contentLines.push(`1 0 0 1 72 ${y} Tm (${escapePdfText(title)}) Tj`);
    y -= 18;
  }

  if (subtitle) {
    contentLines.push(`1 0 0 1 72 ${y} Tm (${escapePdfText(subtitle)}) Tj`);
    y -= 22;
  }

  for (const line of lines) {
    const safe = escapePdfText(line);
    contentLines.push(`1 0 0 1 72 ${y} Tm (${safe}) Tj`);
    y -= 16;
    if (y < 72) break;
  }

  const stream = `BT\n/F1 12 Tf\n${contentLines.join("\n")}\nET`;
  const streamLength = stream.length;

  const objects = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
  );
  objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`);
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let offset = 0;
  const xref = ["xref", "0 6", "0000000000 65535 f "];

  for (const obj of objects) {
    xref.push(String(offset).padStart(10, "0") + " 00000 n ");
    offset += obj.length;
  }

  const xrefOffset = offset;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return `%PDF-1.4\n${objects.join("")}${xref.join("\n")}\n${trailer}`;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSpreadsheetXml({ sheetName, rows }) {
  const safeName = escapeXml(sheetName || "Sheet1");
  const rowXml = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="${safeName}">
    <Table>${rowXml}</Table>
  </Worksheet>
</Workbook>`;
}
