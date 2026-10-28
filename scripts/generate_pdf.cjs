const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_MD = path.join(ROOT_DIR, 'docs', 'DBMS_Report.md');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');
const OUTPUT_PDF = path.join(ROOT_DIR, 'docs', 'NEXUS_MNNIT_DBMS_Project_Report.pdf');
const ARTIFACT_DIR = 'C:\\Users\\husna\\.gemini\\antigravity\\brain\\f49209e4-a812-4965-aa56-af714b6489c5';
const ARTIFACT_PDF = path.join(ARTIFACT_DIR, 'NEXUS_MNNIT_DBMS_Project_Report.pdf');
const TEMP_HTML = path.join(ROOT_DIR, 'temp_report_print.html');

console.log('Reading report markdown...');
let mdContent = fs.readFileSync(REPORT_MD, 'utf8');

// Replace image links with base64 data URLs
const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
mdContent = mdContent.replace(imgRegex, (match, alt, src) => {
  const filename = path.basename(src);
  const localImgPath = path.join(SCREENSHOTS_DIR, filename);
  
  if (fs.existsSync(localImgPath)) {
    const b64 = fs.readFileSync(localImgPath).toString('base64');
    return `<div class="screenshot-card">
      <img src="data:image/png;base64,${b64}" alt="${alt}" class="report-img" />
    </div>`;
  }
  return match;
});

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

const bodyHtml = marked.parse(mdContent);

// Build complete styled HTML document with A4 print rules
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>NEXUS - MNNIT DBMS Project Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 9pt;
        color: #64748B;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
    }

    /* Cover Page Styling */
    .cover-container {
      border: 3px double #0F766E;
      padding: 30px;
      margin-bottom: 40px;
      text-align: center;
      background: #FAFDFA;
      page-break-after: always;
    }

    .cover-container h1 {
      font-size: 20pt;
      color: #064E3B;
      margin: 10px 0 5px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cover-container h3 {
      font-size: 12pt;
      color: #0F766E;
      margin: 4px 0;
      font-weight: 600;
    }

    .cover-container h4 {
      font-size: 11pt;
      color: #475569;
      margin: 2px 0 20px 0;
      font-weight: 500;
    }

    .project-title-box {
      border-top: 2px solid #0F766E;
      border-bottom: 2px solid #0F766E;
      padding: 20px 10px;
      margin: 25px 0;
      background: #F0FDFA;
    }

    .project-title-box h2 {
      font-size: 16pt;
      color: #042F2E;
      margin: 0;
      page-break-before: avoid !important;
    }

    .meta-grid {
      display: flex;
      justify-content: space-between;
      text-align: left;
      margin: 30px 20px 10px 20px;
      font-size: 9.5pt;
    }

    /* Heading Styles */
    h1, h2, h3, h4 {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      color: #0F172A;
      margin-top: 1.4em;
      margin-bottom: 0.5em;
    }

    h2 {
      font-size: 14pt;
      color: #0F766E;
      border-bottom: 1.5px solid #CCFBF1;
      padding-bottom: 6px;
      page-break-before: always;
    }

    /* First section after cover page shouldn't add extra page break */
    .cover-container + h2,
    h2:first-of-type {
      page-break-before: avoid;
    }

    h3 {
      font-size: 11.5pt;
      color: #1E293B;
      margin-top: 1.2em;
    }

    h4 {
      font-size: 10.5pt;
      color: #334155;
    }

    p {
      margin: 0.6em 0;
      text-align: justify;
    }

    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.6em;
    }

    li {
      margin: 0.3em 0;
    }

    /* Code blocks */
    pre {
      background: #091314;
      color: #A7F3D0;
      padding: 12px 14px;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      line-height: 1.45;
      overflow-x: auto;
      border: 1px solid #134E4A;
      margin: 12px 0;
      page-break-inside: avoid;
    }

    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      background: #F1F5F9;
      color: #0F766E;
      padding: 2px 5px;
      border-radius: 4px;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #CBD5E1;
      padding: 7px 10px;
      text-align: left;
    }

    th {
      background: #F0FDFA;
      color: #0F766E;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
    }

    tr:nth-child(even) td {
      background: #F8FAFC;
    }

    /* Screenshot Card */
    .screenshot-card {
      margin: 14px 0 6px 0;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      overflow: hidden;
      background: #0B0F12;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      page-break-inside: avoid;
    }

    .report-img {
      width: 100%;
      height: auto;
      display: block;
    }

    em {
      display: block;
      font-size: 8.5pt;
      color: #475569;
      text-align: center;
      margin-top: 4px;
      margin-bottom: 12px;
      font-style: italic;
    }

    blockquote {
      border-left: 3px solid #0F766E;
      margin: 12px 0;
      padding: 6px 14px;
      background: #F0FDFA;
      color: #334155;
      font-size: 9pt;
    }

    hr {
      border: none;
      border-top: 1px solid #E2E8F0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

fs.writeFileSync(TEMP_HTML, fullHtml, 'utf8');
console.log('HTML intermediate file generated:', TEMP_HTML);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
console.log('Invoking Chrome print-to-pdf...');

const chromeArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-pdf-header-footer',
  `--print-to-pdf="${OUTPUT_PDF}"`,
  `"${TEMP_HTML}"`
];

execSync(`"${chromePath}" ${chromeArgs.join(' ')}`, { stdio: 'inherit' });

if (fs.existsSync(OUTPUT_PDF)) {
  const stat = fs.statSync(OUTPUT_PDF);
  console.log(`PDF Generated Successfully: ${OUTPUT_PDF} (${stat.size} bytes)`);

  // Copy to brain artifact directory
  fs.copyFileSync(OUTPUT_PDF, ARTIFACT_PDF);
  console.log(`Copied PDF to Artifacts: ${ARTIFACT_PDF}`);
} else {
  console.error('Failed to generate PDF');
  process.exit(1);
}
