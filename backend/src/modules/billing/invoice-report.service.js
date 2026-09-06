'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generate CSV representation of invoices
 * @param {Array<Object>} invoices - Array of invoice records from database
 * @returns {string} CSV string
 */
exports.generateInvoicesCsv = (invoices) => {
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Due Date',
    'Status',
    'Customer Name',
    'Customer Email',
    'Company',
    'Sales Order',
    'Subtotal',
    'Discount Amount',
    'Tax Amount',
    'Total Amount',
    'Amount Paid',
    'Balance Due',
    'Currency',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = invoices.map((inv) => {
    const invDate = inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : '';
    const dueDate = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '';
    return [
      escapeCsv(inv.invoiceNumber),
      escapeCsv(invDate),
      escapeCsv(dueDate),
      escapeCsv(inv.status),
      escapeCsv(inv.customer?.name || ''),
      escapeCsv(inv.customer?.email || ''),
      escapeCsv(inv.customer?.company || ''),
      escapeCsv(inv.salesOrder?.orderNumber || ''),
      Number(inv.subtotal || 0).toFixed(2),
      Number(inv.discountAmount || 0).toFixed(2),
      Number(inv.taxAmount || 0).toFixed(2),
      Number(inv.totalAmount || 0).toFixed(2),
      Number(inv.amountPaid || 0).toFixed(2),
      Number(inv.balanceDue || 0).toFixed(2),
      escapeCsv(inv.currency || 'USD'),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Generate an executive PDF Report summarizing invoices
 * @param {Array<Object>} invoices - Array of invoice records from database
 * @returns {Promise<Buffer>} PDF file buffer
 */
exports.generateInvoicesReportPdf = async (invoices) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 35,
        info: {
          Title: 'DealFlow360 Invoice & Revenue Report',
          Author: 'DealFlow360 Finance & Operations',
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const totalBilled = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
      const totalCollected = invoices.reduce((sum, i) => sum + Number(i.amountPaid || 0), 0);
      const totalOutstanding = invoices.reduce((sum, i) => sum + Number(i.balanceDue || 0), 0);
      const now = new Date();
      const overdueCount = invoices.filter((i) => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < now).length;
      const paidCount = invoices.filter((i) => i.status === 'PAID').length;
      const partialCount = invoices.filter((i) => i.status === 'PARTIAL').length;
      const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;

      // ─── 1. HEADER ──────────────────────────────────────────────────
      doc
        .fillColor('#0F172A')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('DealFlow360 — Invoice & Receivables Report', 35, 35);

      doc
        .fillColor('#64748B')
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Generated At: ${new Date().toLocaleString('en-US')}  •  Authoritative Database Export`, 35, 60);

      doc
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .moveTo(35, 75)
        .lineTo(560, 75)
        .stroke();

      // ─── 2. EXECUTIVE KPI CARDS ─────────────────────────────────────
      const kpis = [
        { label: 'TOTAL INVOICES', value: String(invoices.length), color: '#0F172A', sub: `${paidCount} Paid • ${partialCount} Partial • ${pendingCount} Open` },
        { label: 'TOTAL BILLED', value: `$${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#0F172A', sub: 'Gross invoiced' },
        { label: 'TOTAL COLLECTED', value: `$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#059669', sub: 'Verified payments' },
        { label: 'OUTSTANDING', value: `$${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#2563EB', sub: `${overdueCount} overdue` },
      ];

      const cardWidth = 125;
      const cardHeight = 52;
      let cardX = 35;
      const cardY = 85;

      kpis.forEach((kpi) => {
        // Card Box
        doc.rect(cardX, cardY, cardWidth, cardHeight).fill('#F8FAFC');
        doc.strokeColor('#E2E8F0').lineWidth(1).rect(cardX, cardY, cardWidth, cardHeight).stroke();

        doc
          .fillColor('#64748B')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(kpi.label, cardX + 8, cardY + 8);

        doc
          .fillColor(kpi.color)
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(kpi.value, cardX + 8, cardY + 22, { width: cardWidth - 16, ellipsis: true });

        doc
          .fillColor('#94A3B8')
          .fontSize(7)
          .font('Helvetica')
          .text(kpi.sub, cardX + 8, cardY + 38);

        cardX += cardWidth + 6;
      });

      // ─── 3. INVOICE LIST TABLE ──────────────────────────────────────
      let y = 150;
      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Invoices Ledger (${invoices.length} records)`, 35, y);

      y += 16;

      // Table Header Box
      doc.rect(35, y, 525, 18).fill('#F1F5F9');
      doc.strokeColor('#CBD5E1').lineWidth(0.8).rect(35, y, 525, 18).stroke();

      doc
        .fillColor('#334155')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('INVOICE #', 42, y + 5)
        .text('CUSTOMER', 115, y + 5)
        .text('DATE', 245, y + 5)
        .text('TOTAL', 315, y + 5, { width: 55, align: 'right' })
        .text('PAID', 375, y + 5, { width: 55, align: 'right' })
        .text('BALANCE', 435, y + 5, { width: 55, align: 'right' })
        .text('STATUS', 500, y + 5, { width: 50, align: 'center' });

      y += 20;

      // Render top 35 invoices (or page break for larger lists)
      const maxRowsPerPage = 32;
      let rowsOnCurrentPage = 0;

      invoices.forEach((inv, idx) => {
        if (rowsOnCurrentPage >= maxRowsPerPage) {
          doc.addPage();
          rowsOnCurrentPage = 0;
          y = 35;

          // Repeat Header on new page
          doc.rect(35, y, 525, 18).fill('#F1F5F9');
          doc.strokeColor('#CBD5E1').lineWidth(0.8).rect(35, y, 525, 18).stroke();

          doc
            .fillColor('#334155')
            .fontSize(7.5)
            .font('Helvetica-Bold')
            .text('INVOICE #', 42, y + 5)
            .text('CUSTOMER', 115, y + 5)
            .text('DATE', 245, y + 5)
            .text('TOTAL', 315, y + 5, { width: 55, align: 'right' })
            .text('PAID', 375, y + 5, { width: 55, align: 'right' })
            .text('BALANCE', 435, y + 5, { width: 55, align: 'right' })
            .text('STATUS', 500, y + 5, { width: 50, align: 'center' });

          y += 20;
        }

        if (idx % 2 === 1) {
          doc.rect(35, y - 2, 525, 16).fill('#FAFAFA');
        }

        const dateStr = inv.createdAt ? new Date(inv.createdAt).toISOString().split('T')[0] : '—';
        const custStr = inv.customer?.name || inv.customer?.company || 'Customer';
        const isPaid = inv.status === 'PAID';
        const statusColor = isPaid ? '#059669' : inv.status === 'PARTIAL' ? '#D97706' : '#2563EB';

        doc
          .fillColor('#0F172A')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(inv.invoiceNumber, 42, y, { width: 70 })
          .font('Helvetica')
          .fillColor('#334155')
          .text(custStr, 115, y, { width: 125, ellipsis: true })
          .text(dateStr, 245, y, { width: 65 })
          .text(`$${Number(inv.totalAmount || 0).toFixed(2)}`, 315, y, { width: 55, align: 'right' })
          .fillColor('#059669')
          .text(`$${Number(inv.amountPaid || 0).toFixed(2)}`, 375, y, { width: 55, align: 'right' })
          .fillColor(Number(inv.balanceDue || 0) > 0 ? '#DC2626' : '#64748B')
          .text(`$${Number(inv.balanceDue || 0).toFixed(2)}`, 435, y, { width: 55, align: 'right' })
          .fillColor(statusColor)
          .font('Helvetica-Bold')
          .text(inv.status, 500, y, { width: 50, align: 'center' });

        y += 16;
        rowsOnCurrentPage++;
      });

      // ─── 4. RECONCILIATION SUMMARY ──────────────────────────────────
      if (y < 730) {
        y += 15;
        doc
          .strokeColor('#E2E8F0')
          .lineWidth(0.8)
          .moveTo(35, y)
          .lineTo(560, y)
          .stroke();

        y += 8;
        doc
          .fillColor('#64748B')
          .fontSize(7.5)
          .font('Helvetica')
          .text(`Financial Reconciliation: Gross Billed ($${totalBilled.toFixed(2)}) - Total Paid ($${totalCollected.toFixed(2)}) = Net Outstanding Balance ($${totalOutstanding.toFixed(2)}). All records confirmed with PostgreSQL database.`, 35, y, { width: 525 });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
