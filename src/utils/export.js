import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToCSV(filename, columns, rows) {
  const header = columns.map(c => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map(row => columns.map(c => escapeCsvCell(row[c.key])).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

function escapeCsvCell(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── PDF export ──────────────────────────────────────────────────────
export function exportToPDF(filename, columns, rows, { title, subtitle } = {}) {
  const doc = new jsPDF({ orientation: "landscape" });

  if (title) {
    doc.setFontSize(16);
    doc.setTextColor(27, 58, 107); 
    doc.text(title, 14, 16);
  }
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(subtitle, 14, 23);
  }

  autoTable(doc, {
    startY: title ? 28 : 14,
    head: [columns.map(c => c.label)],
    body: rows.map(row => columns.map(c => row[c.key] ?? "")),
    headStyles: { fillColor: [27, 58, 107] },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [247, 246, 242] }, 
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
