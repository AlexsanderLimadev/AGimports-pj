import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Captura um elemento do DOM e salva como PDF A4 (retrato), com
 * paginação automática quando o conteúdo passa de uma página.
 */
export async function exportElementToPDF(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;
  const img = canvas.toDataURL("image/png");

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(img, "PNG", 0, position, pageW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(img, "PNG", 0, position, pageW, imgH);
    heightLeft -= pageH;
  }

  const hoje = new Date().toISOString().slice(0, 10);
  pdf.save(`${filename}-${hoje}.pdf`);
}
