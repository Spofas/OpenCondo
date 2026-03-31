import { jsPDF } from "jspdf";

export interface BudgetPdfData {
  year: number;
  status: string;
  approvedAt: string | null;
  totalAmount: number;
  reserveFundPercentage: number;
  condominiumName: string;
  condominiumAddress: string;
  condominiumNif: string | null;
  items: { category: string; description: string | null; plannedAmount: number }[];
}

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function sectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number
): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(title, x, y);
  y += 2;
  doc.setDrawColor(180);
  doc.line(x, y, x + width, y);
  y += 4;
  return y;
}

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateBudgetPdf(data: BudgetPdfData): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ORÇAMENTO ANUAL", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(12);
  doc.text(`Ano ${data.year}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Condominium info ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.condominiumName, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.condominiumAddress, margin, y);
  y += 4;
  if (data.condominiumNif) {
    doc.text(`NIF: ${data.condominiumNif}`, margin, y);
    y += 4;
  }
  y += 6;

  // --- Status ---
  const statusLabel = data.status === "APPROVED" ? "APROVADO" : "RASCUNHO";
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Estado: ${statusLabel}`, margin, y);
  if (data.status === "APPROVED" && data.approvedAt) {
    doc.setFont("helvetica", "normal");
    doc.text(`  —  Aprovado em ${formatDate(data.approvedAt)}`, margin + doc.getTextWidth(`Estado: ${statusLabel}`), y);
  }
  y += 8;

  // --- Budget Items Table ---
  y = sectionHeader(doc, "RUBRICAS DO ORÇAMENTO", margin, y, contentWidth);
  y += 2;

  // Table header
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 1, contentWidth, 6, "F");
  doc.text("Categoria", margin + 2, y + 3);
  doc.text("Descrição", margin + 60, y + 3);
  doc.text("Valor Previsto", margin + contentWidth - 2, y + 3, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let subtotal = 0;
  for (const item of data.items) {
    y = checkNewPage(doc, y, 10);
    doc.setFont("helvetica", "normal");
    doc.text(item.category, margin + 2, y);
    if (item.description) {
      const desc = item.description.length > 40
        ? item.description.substring(0, 40) + "..."
        : item.description;
      doc.text(desc, margin + 60, y);
    } else {
      doc.setFont("helvetica", "italic");
      doc.text("—", margin + 60, y);
      doc.setFont("helvetica", "normal");
    }
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(item.plannedAmount), margin + contentWidth - 2, y, {
      align: "right",
    });
    subtotal += item.plannedAmount;
    y += 5;
  }

  if (data.items.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma rubrica definida", margin + 4, y);
    y += 5;
  }

  // --- Subtotal line ---
  y += 2;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal (rubricas)", margin + 4, y);
  doc.text(formatCurrency(subtotal), margin + contentWidth - 2, y, {
    align: "right",
  });
  y += 8;

  // --- Reserve Fund ---
  y = checkNewPage(doc, y, 25);
  y = sectionHeader(doc, "FUNDO DE RESERVA", margin, y, contentWidth);
  y += 2;

  const reserveAmount = subtotal * (data.reserveFundPercentage / 100);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Percentagem aplicada: ${data.reserveFundPercentage}%`, margin + 4, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Valor do fundo de reserva", margin + 4, y);
  doc.text(formatCurrency(reserveAmount), margin + contentWidth - 2, y, {
    align: "right",
  });
  y += 8;

  // --- Grand Total ---
  y = checkNewPage(doc, y, 20);
  const grandTotal = subtotal + reserveAmount;

  doc.setFillColor(230, 240, 255);
  doc.rect(margin, y, contentWidth, 12, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DO ORÇAMENTO:", margin + 4, y + 8);
  doc.setFontSize(12);
  doc.text(formatCurrency(grandTotal), margin + contentWidth - 4, y + 8, {
    align: "right",
  });
  y += 18;

  // --- Footer ---
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Documento gerado automaticamente pelo OpenCondo em ${new Date().toLocaleDateString("pt-PT")}`,
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
