import { jsPDF } from "jspdf";

interface AtaPdfData {
  ataNumber: number;
  status: string;
  content: string;
  meetingType: string;
  meetingDate: string;
  meetingLocation: string;
  condominiumName: string;
  condominiumAddress: string;
  condominiumNif: string | null;
  agendaItems: { title: string; description: string | null }[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  ORDINARIA: "Ordinária",
  EXTRAORDINARIA: "Extraordinária",
};

function checkNewPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

export function generateAtaPdf(data: AtaPdfData): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- Header ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ATA DE ASSEMBLEIA", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Ata N.º ${data.ataNumber}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  // --- Status badge ---
  const badgeText = data.status === "FINAL" ? "FINAL" : "RASCUNHO";
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  if (data.status === "FINAL") {
    doc.setFillColor(187, 247, 208); // green-200
    doc.setTextColor(21, 128, 61); // green-700
  } else {
    doc.setFillColor(254, 240, 138); // yellow-200
    doc.setTextColor(161, 98, 7); // yellow-700
  }
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.roundedRect(
    pageWidth / 2 - badgeWidth / 2,
    y - 3.5,
    badgeWidth,
    5,
    1,
    1,
    "F"
  );
  doc.text(badgeText, pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 8;

  // --- Divider ---
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // --- Condominium info ---
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

  // --- Meeting info ---
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DA ASSEMBLEIA", margin + 4, y + 5.5);
  y += 12;

  const labelX = margin + 4;
  const valueX = margin + 50;
  doc.setFontSize(10);

  const meetingRows = [
    ["Tipo:", MEETING_TYPE_LABELS[data.meetingType] || data.meetingType],
    ["Data:", formatDate(data.meetingDate)],
    ["Local:", data.meetingLocation],
  ];

  for (const [label, value] of meetingRows) {
    doc.setFont("helvetica", "normal");
    doc.text(label, labelX, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, valueX, y);
    y += 7;
  }
  y += 8;

  // --- Agenda items ---
  if (data.agendaItems.length > 0) {
    y = checkNewPage(doc, y, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("ORDEM DE TRABALHOS", margin, y);
    y += 2;
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    for (let i = 0; i < data.agendaItems.length; i++) {
      const item = data.agendaItems[i];
      y = checkNewPage(doc, y, 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${item.title}`, margin + 4, y);
      y += 5;

      if (item.description) {
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(item.description, contentWidth - 12);
        for (const line of descLines) {
          y = checkNewPage(doc, y, 5);
          doc.text(line, margin + 8, y);
          y += 4;
        }
      }
      y += 3;
    }
    y += 4;
  }

  // --- Content ---
  y = checkNewPage(doc, y, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("CONTEÚDO DA ATA", margin, y);
  y += 2;
  doc.setDrawColor(180);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const contentLines = doc.splitTextToSize(data.content, contentWidth - 4);
  for (const line of contentLines) {
    y = checkNewPage(doc, y, 5);
    doc.text(line, margin + 2, y);
    y += 4.5;
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
