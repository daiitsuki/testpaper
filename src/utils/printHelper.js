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
            padding-bottom: 0.5rem; /* Reduced to bring line closer to name line */
            margin-bottom: 2rem; /* Restore margin to provide space after the line */
          }
          .header h1 {
            font-size: 24pt;
            font-weight: 900;
            margin: 0 0 0.5rem 0;
            letter-spacing: -0.05em;
          }
          .info {
            display: flex;
            justify-content: flex-end;
            gap: 2rem;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 0.5rem;
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
            column-fill: auto;
          }
          .cols-1 {
            column-count: 1;
          }
          
          .item {
            break-inside: avoid;
            page-break-inside: avoid;
            display: block;
            width: 100%;
            padding-bottom: ${config.spacing}px;
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
          .q-score {
            font-size: 10pt;
            font-weight: bold;
            color: #000;
            margin-top: 5px;
            display: block;
            text-align: right;
          }
          .q-img-wrap {
            flex: 1;
            text-align: center;
          }
          .q-img {
            max-width: 100%;
            height: auto;
          }
          .page-break {
            page-break-before: always;
          }
          .answer-key-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12pt;
          }
          .answer-key-table th, .answer-key-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
          }
          .answer-key-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container ${config.layout === '2column' ? 'cols-2' : 'cols-1'}">
          <div class="header" style="${config.layout === '2column' ? 'column-span: all; -webkit-column-span: all;' : ''}">
            <h1>${title}</h1>
            <div class="info">
              <span>이름: ________________</span>
            </div>
          </div>

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
                  ${img.score > 0 ? `<div class="q-score">(${img.score}점)</div>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="page-break"></div>

        <div class="header">
          <h1>${title} - 정답 및 배점</h1>
        </div>
        
        <table class="answer-key-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>정답</th>
              <th>배점</th>
              <th>번호</th>
              <th>정답</th>
              <th>배점</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const half = Math.ceil(images.length / 2);
              let rows = '';
              for (let i = 0; i < half; i++) {
                const img1 = images[i];
                const img2 = images[i + half];
                rows += `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${img1.answer || '-'}</td>
                    <td>${img1.score || '-'}</td>
                    <td>${img2 ? i + 1 + half : ''}</td>
                    <td>${img2 ? (img2.answer || '-') : ''}</td>
                    <td>${img2 ? (img2.score || '-') : ''}</td>
                  </tr>
                `;
              }
              return rows;
            })()}
          </tbody>
        </table>
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