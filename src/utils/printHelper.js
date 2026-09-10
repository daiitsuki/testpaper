/**
 * WYSIWYG Exam Printing Engine
 * Clones the exact rendered A4 page DOM from ExamPreview,
 * synchronizes all Tailwind & application styles, and executes native print.
 */
export const printExam = (title) => {
  const container = document.getElementById('exam-preview-pages');
  if (!container) {
    console.error('Print container #exam-preview-pages not found');
    return;
  }

  const pages = container.querySelectorAll('.a4-paper');
  if (!pages || pages.length === 0) {
    console.error('No printable .a4-paper pages found');
    return;
  }

  // Create isolated print iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '100vw';
  iframe.style.height = '100vh';
  iframe.style.visibility = 'hidden';
  iframe.style.zIndex = '-1000';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${title || '시험지 인쇄'}</title></head><body></body></html>`);
  doc.close();

  // Copy all style and link tags from main document head
  const headElements = document.querySelectorAll('style, link[rel="stylesheet"]');
  headElements.forEach((el) => {
    doc.head.appendChild(el.cloneNode(true));
  });

  // Inject strict A4 print styles
  const printStyle = doc.createElement('style');
  printStyle.textContent = `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .a4-paper {
      margin: 0 !important;
      box-shadow: none !important;
      width: 210mm !important;
      height: 297mm !important;
      max-height: 297mm !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }
    .a4-paper:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .no-print {
      display: none !important;
    }
  `;
  doc.head.appendChild(printStyle);

  // Clone each .a4-paper page
  pages.forEach((page) => {
    const clone = page.cloneNode(true);
    // Remove any interactive .no-print elements inside the clone
    clone.querySelectorAll('.no-print').forEach((el) => el.remove());
    doc.body.appendChild(clone);
  });

  // Wait for links (stylesheets) and images to load before printing
  const linkPromises = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map((link) => {
    return new Promise((resolve) => {
      link.onload = resolve;
      link.onerror = resolve;
    });
  });

  const imagePromises = Array.from(doc.images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  Promise.all([...linkPromises, ...imagePromises]).then(() => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print failed:', e);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 250);
  });
};