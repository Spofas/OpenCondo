import { jsPDF } from "jspdf";
import type { ContaGerenciaReport } from "@/lib/conta-gerencia";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

export function generateContaGerencia(report: ContaGerenciaReport): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CONTA DE GERÊNCIA", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(12);
  doc.text(`Ano ${report.year}`, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Condominium info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(report.condominiumName, margin, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(report.condominiumAddress, margin, y);
  y += 4;
  if (report.condominiumNif) {
    doc.text(`NIF: ${report.condominiumNif}`, margin, y);
    y += 4;
  }
  y += 6;

  // --- Section: Income ---
  y = sectionHeader(doc, "1. RECEITAS (QUOTAS)", margin, y, contentWidth);
  y += 2;

  const incomeRows = [
    ["Total gerado", formatCurrency(report.totalQuotasGenerated)],
    ["Total cobrado", formatCurrency(report.totalQuotasPaid)],
    ["Pendente", formatCurrency(report.totalQuotasPending)],
    ["Em atraso", formatCurrency(report.totalQuotasOverdue)],
    ["Taxa de cobrança", `${report.collectionRate}%`],
  ];
  y = dataTable(doc, incomeRows, margin, y);
  y += 6;

  // --- Section: Expenses ---
  y = sectionHeader(doc, "2. DESPESAS POR CATEGORIA", margin, y, contentWidth);
  y += 2;

  if (report.expensesByCategory.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Nenhuma despesa registada", margin + 4, y);
    y += 6;
  } else {
    const expenseRows = report.expensesByCategory.map((e) => [
      e.category,
      formatCurrency(e.amount),
    ]);
    expenseRows.push(["TOTAL", formatCurrency(report.totalExpenses)]);
    y = dataTable(doc, expenseRows, margin, y, true);
  }
  y += 6;

  // --- Section: Budget Variance ---
  if (report.budgetLines.length > 0) {
    y = checkNewPage(doc, y, 40);
    y = sectionHeader(doc, "3. ORÇAMENTO vs. REALIZADO", margin, y, contentWidth);
    y += 2;

    // Table header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 1, contentWidth, 6, "F");
    doc.text("Rubrica", margin + 2, y + 3);
    doc.text("Previsto", margin + 80, y + 3, { align: "right" });
    doc.text("Real", margin + 110, y + 3, { align: "right" });
    doc.text("Desvio", margin + contentWidth - 2, y + 3, { align: "right" });
    y += 8;

    doc.setFont("helvetica", "normal");
    for (const line of report.budgetLines) {
      y = checkNewPage(doc, y, 10);
      doc.text(line.category, margin + 2, y);
      doc.text(formatCurrency(line.planned), margin + 80, y, { align: "right" });
      doc.text(formatCurrency(line.actual), margin + 110, y, { align: "right" });
      doc.text(formatCurrency(line.variance), margin + contentWidth - 2, y, {
        align: "right",
      });
      y += 5;
    }
    // Budget total row
    doc.setFont("helvetica", "bold");
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.text("TOTAL", margin + 2, y);
    doc.text(formatCurrency(report.budgetTotal), margin + 80, y, { align: "right" });
    doc.text(formatCurrency(report.totalExpenses), margin + 110, y, { align: "right" });
    doc.text(
      formatCurrency(report.budgetTotal - report.totalExpenses),
      margin + contentWidth - 2,
      y,
      { align: "right" }
    );
    y += 8;
  }

  // --- Section: Reserve Fund ---
  y = checkNewPage(doc, y, 30);
  const reserveSection = report.budgetLines.length > 0 ? "4" : "3";
  y = sectionHeader(
    doc,
    `${reserveSection}. FUNDO DE RESERVA`,
    margin,
    y,
    contentWidth
  );
  y += 2;

  const reserveRows = [
    ["Percentagem aplicada", `${report.reserveFundPercentage}%`],
    ["Contribuições (quotas pagas × %)", formatCurrency(report.reserveFundContributions)],
    ["Saldo estimado", formatCurrency(report.reserveFundBalance)],
  ];
  y = dataTable(doc, reserveRows, margin, y);
  y += 6;

  // --- Section: Balance ---
  y = checkNewPage(doc, y, 20);
  const balanceSection = report.budgetLines.length > 0 ? "5" : "4";
  y = sectionHeader(
    doc,
    `${balanceSection}. BALANÇO`,
    margin,
    y,
    contentWidth
  );
  y += 2;

  doc.setFillColor(230, 240, 255);
  doc.rect(margin, y, contentWidth, 12, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Receitas cobradas:", margin + 4, y + 5);
  doc.text(formatCurrency(report.totalQuotasPaid), margin + 80, y + 5, {
    align: "right",
  });
  doc.text("Despesas:", margin + 90, y + 5);
  doc.text(formatCurrency(report.totalExpenses), margin + contentWidth - 40, y + 5, {
    align: "right",
  });
  doc.text("Saldo:", margin + contentWidth - 30, y + 5);
  doc.text(formatCurrency(report.netBalance), margin + contentWidth - 2, y + 5, {
    align: "right",
  });
  y += 18;

  // --- Section: Unit Debts ---
  if (report.unitDebts.length > 0) {
    y = checkNewPage(doc, y, 30);
    const debtSection = report.budgetLines.length > 0 ? "6" : "5";
    y = sectionHeader(
      doc,
      `${debtSection}. DÍVIDAS POR FRAÇÃO`,
      margin,
      y,
      contentWidth
    );
    y += 2;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 1, contentWidth, 6, "F");
    doc.text("Fração", margin + 2, y + 3);
    doc.text("Proprietário", margin + 30, y + 3);
    doc.text("Pendente", margin + 105, y + 3, { align: "right" });
    doc.text("Em atraso", margin + 135, y + 3, { align: "right" });
    doc.text("Total", margin + contentWidth - 2, y + 3, { align: "right" });
    y += 8;

    doc.setFont("helvetica", "normal");
    for (const unit of report.unitDebts) {
      y = checkNewPage(doc, y, 10);
      doc.text(unit.unitIdentifier, margin + 2, y);
      doc.text(
        (unit.ownerName || "—").substring(0, 30),
        margin + 30,
        y
      );
      doc.text(formatCurrency(unit.pendingAmount), margin + 105, y, {
        align: "right",
      });
      doc.text(formatCurrency(unit.overdueAmount), margin + 135, y, {
        align: "right",
      });
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(unit.totalDebt), margin + contentWidth - 2, y, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      y += 5;
    }
  }

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

// --- Helpers ---

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

function dataTable(
  doc: jsPDF,
  rows: string[][],
  x: number,
  y: number,
  boldLast = false
): number {
  doc.setFontSize(9);
  for (let i = 0; i < rows.length; i++) {
    const [label, value] = rows[i];
    const isBold = boldLast && i === rows.length - 1;
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(label, x + 4, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 120, y, { align: "right" });
    y += 5;
  }
  return y;
}

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}
