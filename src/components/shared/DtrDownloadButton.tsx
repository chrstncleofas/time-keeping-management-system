"use client";
import React from 'react';
import { format, parseISO } from 'date-fns';
import { Download } from 'lucide-react';
import { toast } from '@/lib/toast';

interface AttendanceRecord {
  _id: string;
  date: string;
  timeIn?: { timestamp: string };
  timeOut?: { timestamp: string };
  status: string;
  isLate?: boolean;
  workedHours?: number;
}

interface Props {
  employeeName: string;
  employeeId?: string;
  position?: string;
  department?: string;
  attendanceRecords: AttendanceRecord[];
  periodStart?: Date;
  periodEnd?: Date;
  filename?: string;
}

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  try {
    return format(parseISO(dateStr), 'h:mm a');
  } catch (e) {
    return '';
  }
}

function generateHtml(props: Props) {
  const { employeeName, position = '', department = '', attendanceRecords, periodStart, periodEnd } = props;
  // Default to first half (1-15) of the current month if no range provided
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const defaultStart = new Date(year, month, 1);
  const defaultEnd = new Date(year, month, 15);
  const start = periodStart || defaultStart;
  const end = periodEnd || defaultEnd;

  // Build rows for the selected period (respect periodStart/periodEnd)
  const rows: string[] = [];
  const startDay = start.getDate();
  const endDay = end.getDate();
  for (let day = startDay; day <= endDay; day++) {
    const d = new Date(start.getFullYear(), start.getMonth(), day);
    const dateISO = d.toISOString().split('T')[0];
    const rec = attendanceRecords.find(r => r.date.split('T')[0] === dateISO || r.date === dateISO);
    const inTime = rec?.timeIn ? formatTime(rec.timeIn.timestamp) : '';
    const outTime = rec?.timeOut ? formatTime(rec.timeOut.timestamp) : '';
    const otIn = '';
    const otOut = '';
    rows.push(`
      <tr>
        <td style="border:1px solid #000;padding:6px;text-align:center">${day}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${inTime}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${outTime}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${inTime}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${outTime}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${otIn}</td>
        <td style="border:1px solid #000;padding:6px;text-align:center">${otOut}</td>
      </tr>
    `);
  }

  const periodLabel = `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>DTR - ${employeeName}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111; }
      .container { max-width: 720px; margin: 6px auto; }
      .small { font-size: 12px; }
      .meta-line { border-bottom:1px solid #000; padding:4px 0; }
      table { border-collapse: collapse; width: 100%; margin-top:8px }
      th, td { border:1px solid #000; padding:6px; font-size:12px }
      thead th { background: #fff; }
      .overtime-head { text-align:center; }
      .footer-note { margin-top:6px; font-size:12px; text-align:center }
      .signature { margin-top:36px; text-align:center }
      .total { color: #d00; float:right; font-weight:bold }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="small meta-line"><strong>Time Ending:</strong> ${periodLabel}</div>
      <div class="small meta-line"><strong>Name:</strong> ${employeeName}</div>
      <div class="small meta-line"><strong>Position:</strong> ${position}</div>
      <div class="small meta-line"><strong>Department:</strong> ${department}</div>

      <table>
        <thead>
          <tr>
            <th style="width:40px">Days</th>
            <th>IN</th>
            <th>OUT</th>
            <th>IN</th>
            <th>OUT</th>
            <th colspan="2" class="overtime-head">OVERTIME</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>IN</th>
            <th>OUT</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('\n')}
        </tbody>
      </table>

      <div class="total">0</div>
      <div class="footer-note">I hereby certify that the above records are true and correct</div>
      <div class="signature">______________________________<br/>EMPLOYEE'S SIGNATURE</div>
    </div>
  </body>
  </html>
  `;
}

export default function DtrDownloadButton(props: Props) {
  const { filename = 'dtr.pdf' } = props;

  const handleDownload = async () => {
    const html = generateHtml(props);

    // Try to generate a PDF client-side using jspdf + html2canvas if available.
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      // Render HTML to a hidden container so html2canvas can capture it
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '800px';
      container.innerHTML = html;
      document.body.appendChild(container);

      // Wait a tick for images/fonts to load
      await new Promise((res) => setTimeout(res, 100));

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = (pdf as any).getImageProperties ? (pdf as any).getImageProperties(imgData) : { width: canvas.width, height: canvas.height };
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save((filename || 'dtr') + '.pdf');
      document.body.removeChild(container);
      toast.success('DTR downloaded as PDF');
      return;
    } catch (err) {
      // If PDF libs are not available or an error occurs, fall back to previous behavior
      console.warn('PDF generation failed or libraries missing:', err);
    }

    // Fallback: open HTML in new window and prompt print (existing behavior)
    try {
      const w = window.open('', '_blank', 'noopener');
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.onload = () => {
          try {
            w.focus();
            w.print();
          } catch (e) {
            // ignore
          }
        };
        return;
      }
    } catch (e) {
      // ignore and fallback to download HTML
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename || 'dtr') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.error('Popup blocked — saved DTR as HTML. Open and print to PDF.');
  };

  return (
    <button
      onClick={handleDownload}
      className="flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
      aria-label="Download DTR"
    >
      <Download className="w-4 h-4" />
      <span className="text-sm font-medium">Download DTR</span>
    </button>
  );
}
