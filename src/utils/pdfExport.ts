import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads a high-quality PDF from an HTML element ID.
 * Works seamlessly inside iframes and sandboxed environments where window.print() is restricted.
 */
export async function exportElementToPdf(
  elementId: string,
  filename: string = 'Dokumen_CPMI'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return false;
  }

  try {
    // Clone or capture element
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution (retina display quality)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create A4 PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10; // 10mm margins
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Check if multi-page is needed
    if (contentHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    } else {
      let position = margin;
      let remainingHeight = contentHeight;
      const effectivePageHeight = pageHeight - margin * 2;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'JPEG', margin, position, contentWidth, contentHeight);
        remainingHeight -= effectivePageHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          position -= effectivePageHeight;
        }
      }
    }

    const safeName = filename.replace(/[^\w-]/g, '_');
    pdf.save(`${safeName}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}
