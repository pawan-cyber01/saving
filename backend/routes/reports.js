// routes/reports.js — Server-side PDF/Excel report generation
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimit');
const admin = require('../services/firebase');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const db = admin.firestore();

// Helper to get user's expenses for a date range
async function getUserExpenses(uid, fromDate, toDate) {
  const snap = await db.collection('users').doc(uid)
    .collection('expenses')
    .where('date', '>=', fromDate)
    .where('date', '<=', toDate)
    .orderBy('date', 'asc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Helper to get user's savings for a date range
async function getUserSavings(uid, fromDate, toDate) {
  const snap = await db.collection('users').doc(uid)
    .collection('savings')
    .where(admin.firestore.FieldPath.documentId(), '>=', fromDate)
    .where(admin.firestore.FieldPath.documentId(), '<=', toDate)
    .get();
  return snap.docs.map(d => ({ date: d.id, ...d.data() }));
}

// POST /api/reports/pdf — Generate PDF report
router.post('/pdf', verifyToken, reportLimiter, async (req, res) => {
  const { fromDate, toDate, type } = req.body;
  const uid = req.user.uid;

  try {
    const [expenses, savings] = await Promise.all([
      getUserExpenses(uid, fromDate, toDate),
      getUserSavings(uid, fromDate, toDate),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalSaved = savings.reduce((s, e) => s + (e.amount || 0), 0);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SaveLock_Report_${fromDate}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#7c3aed').text('SaveLock Financial Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica').fillColor('#666').text(`Period: ${fromDate} to ${toDate}`, { align: 'center' });
    doc.moveDown(0.3).text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
    doc.moveDown(1);

    // Summary box
    doc.rect(40, doc.y, doc.page.width - 80, 70).fill('#f5f0ff').stroke();
    const summaryY = doc.y - 55;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('Summary', 50, summaryY + 8);
    doc.font('Helvetica').fillColor('#c00').text(`Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`, 50, summaryY + 25);
    doc.fillColor('#0c0').text(`Total Savings: ₹${totalSaved.toLocaleString('en-IN')}`, 50, summaryY + 42);
    doc.fillColor('#333').text(`Transactions: ${expenses.length + savings.length}`, 300, summaryY + 25);
    doc.moveDown(3);

    // Expenses table
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#333').text('Expenses');
    doc.moveDown(0.5);
    const expCols = [{ label: 'Date', w: 70 }, { label: 'Category', w: 90 }, { label: 'Note', w: 150 }, { label: 'Method', w: 80 }, { label: 'Amount', w: 70 }];
    let x = 40, tableY = doc.y;
    doc.rect(40, tableY, 460, 18).fill('#e8e0ff').stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#555');
    expCols.forEach(col => { doc.text(col.label, x + 3, tableY + 4, { width: col.w - 6 }); x += col.w; });
    doc.y = tableY + 20;

    expenses.slice(0, 50).forEach((exp, i) => {
      if (doc.y > 700) doc.addPage();
      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(40, rowY, 460, 16).fill('#fafafe').stroke();
      x = 40; doc.font('Helvetica').fillColor('#333').fontSize(8);
      [exp.date, exp.category || '', (exp.note || '').slice(0, 25), exp.paymentMethod || 'UPI', `₹${(exp.amount||0).toLocaleString('en-IN')}`].forEach((val, idx) => {
        doc.text(val, x + 3, rowY + 3, { width: expCols[idx].w - 6 });
        x += expCols[idx].w;
      });
      doc.y = rowY + 18;
    });

    doc.end();
  } catch(err) {
    if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed' });
  }
});

// POST /api/reports/excel — Generate Excel report
router.post('/excel', verifyToken, reportLimiter, async (req, res) => {
  const { fromDate, toDate } = req.body;
  const uid = req.user.uid;

  try {
    const [expenses, savings] = await Promise.all([
      getUserExpenses(uid, fromDate, toDate),
      getUserSavings(uid, fromDate, toDate),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SaveLock';

    // Expenses sheet
    const expSheet = workbook.addWorksheet('Expenses');
    expSheet.addRow(['Date', 'Category', 'Note', 'Payment Method', 'Amount (₹)']);
    expSheet.getRow(1).font = { bold: true, color: { argb: 'FF7c3aed' } };
    expenses.forEach(e => expSheet.addRow([e.date, e.category, e.note || '', e.paymentMethod || 'UPI', e.amount]));

    // Savings sheet
    const savSheet = workbook.addWorksheet('Savings');
    savSheet.addRow(['Date', 'Amount (₹)', 'Method']);
    savSheet.getRow(1).font = { bold: true, color: { argb: 'FF14b8a6' } };
    savings.forEach(s => savSheet.addRow([s.date, s.amount, s.method || 'manual']));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="SaveLock_${fromDate}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch(err) {
    if (!res.headersSent) res.status(500).json({ error: 'Excel generation failed' });
  }
});

module.exports = router;
