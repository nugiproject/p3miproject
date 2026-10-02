/**
 * Helper utility for printing documents reliably across all browsers and iframe environments.
 */

export function printElementById(elementId?: string, documentTitle?: string) {
  if (documentTitle) {
    try {
      document.title = documentTitle;
    } catch {
      // ignore
    }
  }

  // Directly invoke window.print()
  try {
    window.print();
  } catch (err) {
    console.error('window.print() error:', err);
  }
}

/**
 * Downloads the printable document as a standalone, styled HTML file.
 * This guarantees the user can save the exact document locally and print/convert to PDF anytime.
 */
export function downloadDocumentAsHtml(
  elementId: string,
  filename: string = 'Dokumen_CPMI',
  documentTitle: string = 'Dokumen Resmi'
) {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>${documentTitle}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #212529;
      background-color: #f8fafc;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .print-banner {
      max-width: 210mm;
      margin: 0 auto 20px auto;
      background: #1F3A5F;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-banner button {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 18px;
      font-weight: 700;
      font-size: 13px;
      border-radius: 8px;
      cursor: pointer;
    }
    .paper-sheet {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 36px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
    }
    .border-b-2 { border-bottom-width: 2px; }
    .border-t { border-top-width: 1px; }
    .border-r { border-right-width: 1px; }
    .border { border-width: 1px; }
    .border-double { border-style: double; }
    .border-slate-200 { border-color: #e2e8f0; }
    .border-slate-300 { border-color: #cbd5e1; }
    .border-slate-400 { border-color: #94a3b8; }
    .bg-slate-50 { background-color: #f8fafc; }
    .bg-slate-100 { background-color: #f1f5f9; }
    .bg-amber-50 { background-color: #fffbeb; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .uppercase { text-transform: uppercase; }
    .underline { text-decoration: underline; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .gap-8 { gap: 2rem; }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mb-14 { margin-bottom: 3.5rem; }
    .mb-16 { margin-bottom: 4rem; }
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .p-8 { padding: 2rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded { border-radius: 0.25rem; }
    .text-xs { font-size: 11px; line-height: 1.4; }
    .text-sm { font-size: 13px; line-height: 1.4; }
    .text-base { font-size: 15px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 20px; }
    .text-slate-500 { color: #64748b; }
    .text-slate-600 { color: #475569; }
    .text-slate-700 { color: #334155; }
    .text-blue-900 { color: #1e3a8a; }
    .text-emerald-700 { color: #047857; }
    .text-amber-800 { color: #92400e; }
    .w-full { width: 100%; }
    .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .print-banner {
        display: none !important;
      }
      .paper-sheet {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-banner">
    <div>
      <strong style="font-size: 14px;">${documentTitle}</strong>
      <div style="font-size: 11px; opacity: 0.85;">Siap Dicetak atau Simpan sebagai PDF</div>
    </div>
    <button onclick="window.print()">Cetak Dokumen Sekarang (Ctrl+P)</button>
  </div>
  <div class="paper-sheet">
    ${el.innerHTML}
  </div>
  <script>
    window.addEventListener('load', function() {
      // Auto open print dialog when opened in new tab/browser
      setTimeout(function() { window.print(); }, 400);
    });
  </script>
</body>
</html>`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename.replace(/[^\w-]/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open a standalone popup window for printing if supported.
 * Falls back safely to window.print() without breaking.
 */
export function openPrintInNewWindow(elementId: string, documentTitle: string = 'Dokumen CPMI') {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // If popup blocked by iframe sandbox, trigger in-window print
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <meta charset="utf-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 8px 16px; background: #1F3A5F; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
              Cetak Dokumen (Ctrl+P)
            </button>
          </div>
          ${el.innerHTML}
          <script>
            setTimeout(function() { window.print(); }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err) {
    console.warn('Popup blocked, triggering direct print', err);
    window.print();
  }
}
