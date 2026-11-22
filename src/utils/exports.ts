import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const DEFAULT_LOGO_URL = '/src/assets/images/alert_mfb_logo_1795361377773.jpg';
export const DEFAULT_ADMIN_AVATAR_URL = '/src/assets/images/hr_admin_avatar_1795361378422.jpg';

export function exportRowsToExcel(
  rows: Record<string, string | number>[],
  sheetName: string,
  fileName: string
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

export function exportRowsToCsv(rows: Record<string, string | number>[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function loadImageAsDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:image/')) return src;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportReportToPdf(options: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number)[][];
  fileName: string;
  logoUrl?: string;
  orientation?: 'portrait' | 'landscape';
}) {
  const orientation = options.orientation || (options.columns.length > 6 ? 'landscape' : 'portrait');
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Corporate Navy Banner
  doc.setFillColor(12, 8, 67); // #0C0843
  doc.rect(0, 0, pageWidth, 68, 'F');

  // Corporate Gold Divider Line
  doc.setFillColor(210, 169, 70); // #D2A946
  doc.rect(0, 68, pageWidth, 3, 'F');

  const logoData = await loadImageAsDataUrl(options.logoUrl || DEFAULT_LOGO_URL);
  if (logoData) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(28, 12, 44, 44, 4, 4, 'F');
      doc.addImage(logoData, 'JPEG', 30, 14, 40, 40);
    } catch {
      // Ignore image format issue if custom logo isn't JPEG/PNG
    }
  }

  const textX = logoData ? 84 : 28;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ALERT MFB — HR Management System', textX, 30);

  doc.setTextColor(229, 198, 111); // #E5C66F
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Empowering People. Building Excellence.', textX, 46);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    pageWidth - 28,
    34,
    { align: 'right' }
  );

  // Report Heading
  doc.setTextColor(12, 8, 67);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(options.title, 28, 96);

  if (options.subtitle) {
    doc.setTextColor(107, 107, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(options.subtitle, 28, 112);
  }

  autoTable(doc, {
    startY: options.subtitle ? 126 : 112,
    head: [options.columns],
    body: options.rows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      textColor: [23, 23, 43],
      lineColor: [230, 229, 237],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [12, 8, 67],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [246, 246, 250],
    },
    margin: { left: 28, right: 28, bottom: 36 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(107, 107, 128);
      doc.text(
        `© ALERT MFB | Human Resources Management System  ·  Page ${data.pageNumber} of ${pageCount}`,
        28,
        doc.internal.pageSize.getHeight() - 16
      );
    },
  });

  doc.save(options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`);
}
