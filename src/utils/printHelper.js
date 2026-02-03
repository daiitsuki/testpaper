export const printExam = (title, images, config) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow.document;

  // Generate HTML content
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          .header {
            text-align: center;
            border-bottom: 4px double #000;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }
          .header h1 {
            font-size: 24pt;
            font-weight: 900;
            margin: 0 0 0.5rem 0;
            letter-spacing: -0.05em;
          }
          .info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            font-size: 12pt;
            font-weight: bold;
          }
          .container {
            display: block;
            width: 100%;
            position: relative;
          }
          /* Column Layout */
          .cols-2 {
            column-count: 2;
            column-gap: 3rem;
            column-rule: 1px solid #e2e8f0; /* Adding the dividing line */
          }
          .cols-1 {
            column-count: 1;
          }
          
          .item {
            break-inside: avoid;
            page-break-inside: avoid;
            display: inline-block;
            width: 100%;
            margin-bottom: ${config.spacing}px;
          }
          .item-content {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .q-num {
            font-weight: bold;
            font-size: 14pt;
            line-height: 1;
            padding-top: 0.2rem;
            flex-shrink: 0;
          }
          .q-img-wrap {
            flex: 1;
            text-align: center;
          }
          .q-img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="info">
            <span>이름: ________</span>
          </div>
        </div>

        <div class="container ${config.layout === '2column' ? 'cols-2' : 'cols-1'}">
          ${images.map((img, idx) => `
            <div class="item">
              <div class="item-content">
                <span class="q-num">${idx + 1}.</span>
                <div class="q-img-wrap">
                  <img 
                    src="${img.url}" 
                    class="q-img" 
                    alt="Q${idx + 1}" 
                    style="width: ${img.scale || 100}%"
                    loading="eager" 
                  />
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(content);
  doc.close();

  iframe.contentWindow.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Print failed', e);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    }, 500);
  };
};
