'use strict';

const PDFDocument = require('pdfkit');

/**
 * Generate a production-grade PDF invoice buffer from database record
 * @param {Object} invoice - Complete invoice record with customer, salesOrder, lines, payments
 * @returns {Promise<Buffer>} PDF file buffer
 */
exports.generateInvoicePdf = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: 'DealFlow360 Sales Operations',
          Subject: `Invoice ${invoice.invoiceNumber} for ${invoice.customer?.name || 'Customer'}`,
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const currencySymbol = invoice.currency === 'EUR' ? '€' : invoice.currency === 'GBP' ? '£' : invoice.currency === 'INR' ? '₹' : '$';

      // ─── 1. HEADER ──────────────────────────────────────────────────
      // Brand / Company
      doc
        .fillColor('#0F172A')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('DEALFLOW360', 40, 40);

      doc
        .fillColor('#64748B')
        .fontSize(8)
        .font('Helvetica')
        .text('INTELLIGENT SALES OPERATIONS PLATFORM', 40, 66);

      doc
        .fontSize(8)
        .fillColor('#94A3B8')
        .text('dealflow360.enterprise • billing@dealflow360.com', 40, 78);

      // Invoice Title & Meta (Right aligned)
      doc
        .fillColor('#0F172A')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 350, 40, { align: 'right', width: 205 });

      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(invoice.invoiceNumber, 350, 65, { align: 'right', width: 205 });

      // Status Badge (Right aligned)
      const statusColor = invoice.status === 'PAID' ? '#059669' : invoice.status === 'PARTIAL' ? '#D97706' : '#2563EB';
      doc
        .fillColor(statusColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`STATUS: ${invoice.status}`, 350, 80, { align: 'right', width: 205 });

      // Header Divider Line
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(1)
        .moveTo(40, 100)
        .lineTo(555, 100)
        .stroke();

      // ─── 2. INVOICE META & CUSTOMER DETAILS ─────────────────────────
      let y = 115;

      // Left Column: Customer (Bill To)
      doc
        .fillColor('#64748B')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('BILLED TO', 40, y);

      const custName = invoice.customer?.name || 'Valued Customer';
      const company = invoice.customer?.company;
      const email = invoice.customer?.email;
      const address = invoice.customer?.address;

      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(custName, 40, y + 14);

      let custY = y + 28;
      if (company && company !== custName) {
        doc.fillColor('#334155').fontSize(9).font('Helvetica').text(company, 40, custY);
        custY += 13;
      }
      if (email) {
        doc.fillColor('#475569').fontSize(9).font('Helvetica').text(email, 40, custY);
        custY += 13;
      }
      if (address) {
        doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(address, 40, custY, { width: 240 });
      }

      // Right Column: Invoice Details
      const metaX = 340;
      doc
        .fillColor('#64748B')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('INVOICE DETAILS', metaX, y);

      const invoiceDateStr = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Net 30';

      const metaFields = [
        ['Invoice Date:', invoiceDateStr],
        ['Due Date:', dueDateStr],
        ['Sales Order:', invoice.salesOrder?.orderNumber || 'Direct'],
        ['Currency:', invoice.currency || 'USD'],
      ];

      if (invoice.paidAt) {
        metaFields.push(['Paid At:', new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })]);
      }

      let metaY = y + 14;
      metaFields.forEach(([label, val]) => {
        doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text(label, metaX, metaY);
        doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold').text(val, metaX + 80, metaY, { align: 'right', width: 135 });
        metaY += 13;
      });

      // ─── 3. LINE ITEMS TABLE ────────────────────────────────────────
      y = 195;

      // Table Header Box
      doc
        .rect(40, y, 515, 20)
        .fill('#F8FAFC');

      doc
        .strokeColor('#E2E8F0')
        .lineWidth(1)
        .rect(40, y, 515, 20)
        .stroke();

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('ITEM & DESCRIPTION', 50, y + 6)
        .text('QTY', 285, y + 6, { width: 40, align: 'right' })
        .text('UNIT PRICE', 335, y + 6, { width: 65, align: 'right' })
        .text('DISCOUNT', 410, y + 6, { width: 65, align: 'right' })
        .text('TOTAL', 485, y + 6, { width: 60, align: 'right' });

      y += 24;

      const lines = invoice.lines && invoice.lines.length > 0
        ? invoice.lines
        : [{ description: 'Sales Order Fulfillment', quantity: 1, unitPrice: invoice.totalAmount, discountAmount: 0, lineTotal: invoice.totalAmount }];

      lines.forEach((line, idx) => {
        // Row background alternating
        if (idx % 2 === 1) {
          doc.rect(40, y - 2, 515, 20).fill('#FAFAFA');
        }

        const itemName = line.product?.name || line.description || 'Line Item';
        const sku = line.product?.sku ? ` [${line.product.sku}]` : '';

        doc
          .fillColor('#0F172A')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(itemName + sku, 50, y, { width: 230, ellipsis: true });

        doc
          .fillColor('#334155')
          .fontSize(8.5)
          .font('Helvetica')
          .text(String(line.quantity || 1), 285, y, { width: 40, align: 'right' })
          .text(`${currencySymbol}${Number(line.unitPrice || 0).toFixed(2)}`, 335, y, { width: 65, align: 'right' })
          .text(Number(line.discountAmount || 0) > 0 ? `-${currencySymbol}${Number(line.discountAmount).toFixed(2)}` : '—', 410, y, { width: 65, align: 'right' })
          .font('Helvetica-Bold')
          .text(`${currencySymbol}${Number(line.lineTotal || 0).toFixed(2)}`, 485, y, { width: 60, align: 'right' });

        y += 18;

        // Subtle row separator
        doc
          .strokeColor('#F1F5F9')
          .lineWidth(0.5)
          .moveTo(40, y)
          .lineTo(555, y)
          .stroke();

        y += 2;
      });

      // ─── 4. FINANCIAL TOTALS SUMMARY ────────────────────────────────
      y += 10;
      const totalsX = 330;
      const totalsValX = 450;
      const totalsWidth = 95;

      // Subtotal
      doc
        .fillColor('#64748B')
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', totalsX, y)
        .fillColor('#0F172A')
        .text(`${currencySymbol}${Number(invoice.subtotal || 0).toFixed(2)}`, totalsValX, y, { width: totalsWidth, align: 'right' });
      y += 15;

      // Discount
      if (Number(invoice.discountAmount || 0) > 0) {
        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica')
          .text('Total Discount:', totalsX, y)
          .fillColor('#059669')
          .text(`-${currencySymbol}${Number(invoice.discountAmount).toFixed(2)}`, totalsValX, y, { width: totalsWidth, align: 'right' });
        y += 15;
      }

      // Tax
      if (Number(invoice.taxAmount || 0) > 0) {
        doc
          .fillColor('#64748B')
          .fontSize(9)
          .font('Helvetica')
          .text('Estimated Tax:', totalsX, y)
          .fillColor('#0F172A')
          .text(`${currencySymbol}${Number(invoice.taxAmount).toFixed(2)}`, totalsValX, y, { width: totalsWidth, align: 'right' });
        y += 15;
      }

      // Divider
      doc
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .moveTo(totalsX, y)
        .lineTo(555, y)
        .stroke();
      y += 6;

      // Total Amount
      doc
        .fillColor('#0F172A')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('TOTAL AMOUNT:', totalsX, y)
        .text(`${currencySymbol}${Number(invoice.totalAmount || 0).toFixed(2)}`, totalsValX, y, { width: totalsWidth, align: 'right' });
      y += 18;

      // Amount Paid
      doc
        .fillColor('#059669')
        .fontSize(9.5)
        .font('Helvetica')
        .text('Amount Paid:', totalsX, y)
        .font('Helvetica-Bold')
        .text(`${currencySymbol}${Number(invoice.amountPaid || 0).toFixed(2)}`, totalsValX, y, { width: totalsWidth, align: 'right' });
      y += 15;

      // Balance Due (Boxed for emphasis)
      doc
        .rect(totalsX - 6, y - 2, 230, 24)
        .fill(Number(invoice.balanceDue || 0) <= 0.001 ? '#F0FDF4' : '#EFF6FF');

      doc
        .strokeColor(Number(invoice.balanceDue || 0) <= 0.001 ? '#86EFAC' : '#BFDBFE')
        .lineWidth(1)
        .rect(totalsX - 6, y - 2, 230, 24)
        .stroke();

      doc
        .fillColor(Number(invoice.balanceDue || 0) <= 0.001 ? '#15803D' : '#1D4ED8')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BALANCE DUE:', totalsX, y + 4)
        .text(`${currencySymbol}${Number(invoice.balanceDue || 0).toFixed(2)}`, totalsValX, y + 4, { width: totalsWidth, align: 'right' });

      // ─── 5. PAYMENT HISTORY (IF ANY) ────────────────────────────────
      if (invoice.payments && invoice.payments.length > 0) {
        y += 40;
        doc
          .fillColor('#0F172A')
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('PAYMENT TRANSACTIONS', 40, y);

        y += 14;
        invoice.payments.forEach((p) => {
          const payDate = p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-US') : new Date(p.createdAt).toLocaleDateString('en-US');
          doc
            .fillColor('#64748B')
            .fontSize(8)
            .font('Helvetica')
            .text(`• ${payDate} — ${p.method || 'Direct'} — Ref: ${p.reference || '—'} — Status: ${p.status}`, 45, y)
            .font('Helvetica-Bold')
            .fillColor('#059669')
            .text(`${currencySymbol}${Number(p.amount).toFixed(2)}`, 450, y, { width: 95, align: 'right' });
          y += 12;
        });
      }

      // ─── 6. FOOTER ──────────────────────────────────────────────────
      const footerY = 740;
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(1)
        .moveTo(40, footerY)
        .lineTo(555, footerY)
        .stroke();

      doc
        .fillColor('#64748B')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('Thank you for choosing DealFlow360.', 40, footerY + 10, { align: 'center', width: 515 });

      doc
        .fillColor('#94A3B8')
        .fontSize(7.5)
        .font('Helvetica')
        .text('For wire transfers, automated ACH, or inquiries, contact billing@dealflow360.com. Terms: Net 30 days unless negotiated.', 40, footerY + 22, { align: 'center', width: 515 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
