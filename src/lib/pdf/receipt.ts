import { jsPDF } from "jspdf";

interface ReceiptData {
  condominiumName: string;
  condominiumNif: string | null;
  condominiumAddress: string;
  unitIdentifier: string;
  ownerName: string | null;
  period: string;
  amount: number;
  dueDate: string;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: "Transferência bancária",
  numerario: "Numerário",
  cheque: "Cheque",
  mbway: "MB WAY",
  multibanco: "Multibanco",
  outro: "Outro",
};

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

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

export function generateReceipt(data: ReceiptData): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE QUOTA", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N.º ${data.receiptNumber}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Condominium info
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.condominiumName, margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.condominiumAddress, margin, y);
  y += 5;

  if (data.condominiumNif) {
    doc.text(`NIF: ${data.condominiumNif}`, margin, y);
    y += 5;
  }
  y += 8;

  // Payment details table
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO PAGAMENTO", margin + 4, y + 5.5);
  y += 12;

  const labelX = margin + 4;
  const valueX = margin + 50;
  doc.setFontSize(10);

  const rows = [
    ["Fração:", data.unitIdentifier],
    ["Condómino:", data.ownerName || "—"],
    ["Período:", formatPeriod(data.period)],
    ["Valor:", formatCurrency(data.amount)],
    ["Data de vencimento:", formatDate(data.dueDate)],
    ["Data de pagamento:", formatDate(data.paymentDate)],
    ["Método:", PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod],
  ];

  for (const [label, value] of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, valueX, y);
    y += 7;
  }

  y += 10;

  // Amount highlight
  doc.setFillColor(230, 240, 255);
  doc.rect(margin, y, contentWidth, 14, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VALOR PAGO:", margin + 4, y + 9);
  doc.setFontSize(14);
  doc.text(formatCurrency(data.amount), pageWidth - margin - 4, y + 9, {
    align: "right",
  });
  y += 24;

  // Signature line
  doc.setDrawColor(180);
  doc.line(margin, y + 20, margin + 70, y + 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("A Administração", margin, y + 25);

  // Date line
  doc.line(pageWidth - margin - 70, y + 20, pageWidth - margin, y + 20);
  doc.text("Data", pageWidth - margin - 70, y + 25);

  // Footer
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
