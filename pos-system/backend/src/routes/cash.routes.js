import { Router } from 'express';
import db, { createBackup } from '../db/database.js';

const router = Router();

// Asegurar que las tablas de caja y movimientos existan
db.exec(`
  CREATE TABLE IF NOT EXISTS cash_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    initial_amount REAL DEFAULT 0,
    opened_by TEXT DEFAULT 'Cajero',
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    closed_by TEXT,
    final_cash_counted REAL,
    expected_cash REAL,
    difference REAL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER,
    type TEXT NOT NULL, -- 'EXPENSE' o 'INCOME'
    category TEXT DEFAULT 'Varios',
    amount REAL NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 1. Obtener estado del turno actual
router.get('/current-shift', (req, res) => {
  try {
    const activeShift = db.prepare(`
      SELECT * FROM cash_shifts 
      WHERE closed_at IS NULL 
      ORDER BY id DESC LIMIT 1
    `).get();

    if (!activeShift) {
      return res.json({ isOpen: false });
    }

    // Ventas del turno
    const salesBreakdown = db.prepare(`
      SELECT 
        payment_method,
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(id) as count
      FROM sales
      WHERE created_at >= ? AND status = 'COMPLETED'
    `).all(activeShift.opened_at);

    // Egresos / Gastos del turno
    const cashOutRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses, COUNT(id) as count
      FROM cash_movements
      WHERE created_at >= ? AND type = 'EXPENSE'
    `).get(activeShift.opened_at);

    const cashSales = salesBreakdown.find(s => s.payment_method === 'CASH')?.total || 0;
    const qrSales = salesBreakdown.find(s => s.payment_method === 'QR_TRANSFER')?.total || 0;
    const cardSales = salesBreakdown.find(s => s.payment_method === 'CARD')?.total || 0;
    const totalExpenses = cashOutRow.total_expenses || 0;

    // Fórmula del efectivo esperado: Base + Ventas Efectivo - Egresos
    const expectedCash = Number(activeShift.initial_amount) + Number(cashSales) - Number(totalExpenses);

    res.json({
      isOpen: true,
      shift: activeShift,
      summary: {
        initialAmount: activeShift.initial_amount,
        cashSales,
        qrSales,
        cardSales,
        totalExpenses,
        expenseCount: cashOutRow.count || 0,
        expectedCash
      }
    });
  } catch (error) {
    console.error('Error en current-shift:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Abrir turno
router.post('/open-shift', (req, res) => {
  const { initial_amount, opened_by } = req.body;
  try {
    const existing = db.prepare('SELECT id FROM cash_shifts WHERE closed_at IS NULL').get();
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un turno de caja abierto.' });
    }

    const info = db.prepare(`
      INSERT INTO cash_shifts (initial_amount, opened_by, opened_at)
      VALUES (?, ?, datetime('now', 'localtime'))
    `).run(Number(initial_amount) || 0, opened_by || 'Cajero');

    res.json({ success: true, shiftId: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Cerrar turno (Arqueo) + Auto-Backup
router.post('/close-shift', (req, res) => {
  const { shift_id, counted_cash, notes, closed_by } = req.body;
  try {
    const shift = db.prepare('SELECT * FROM cash_shifts WHERE id = ?').get(shift_id);
    if (!shift) return res.status(404).json({ error: 'Turno no encontrado' });

    // Consulta de ventas en efectivo
    const cashSalesRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE created_at >= ? AND payment_method = 'CASH' AND status = 'COMPLETED'
    `).get(shift.opened_at);

    // Consulta de egresos / gastos
    const expenseRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM cash_movements
      WHERE created_at >= ? AND type = 'EXPENSE'
    `).get(shift.opened_at);

    const cashSales = Number(cashSalesRow?.total || 0);
    const totalExpenses = Number(expenseRow?.total || 0);
    const expectedCash = Number(shift.initial_amount) + cashSales - totalExpenses;
    const counted = Number(counted_cash) || 0;
    const difference = counted - expectedCash;

    db.prepare(`
      UPDATE cash_shifts
      SET closed_at = datetime('now', 'localtime'),
          final_cash_counted = ?,
          expected_cash = ?,
          difference = ?,
          notes = ?,
          closed_by = ?
      WHERE id = ?
    `).run(counted, expectedCash, difference, notes || '', closed_by || 'Cajero', shift_id);

    // Disparo automático de la copia de seguridad
    const backupResult = typeof createBackup === 'function' ? createBackup() : null;

    res.json({
      success: true,
      backup: backupResult,
      summary: {
        initialAmount: shift.initial_amount,
        cashSales,
        totalExpenses,
        expectedCash,
        countedCash: counted,
        difference,
        status: difference === 0 ? 'EXACT' : difference > 0 ? 'SURPLUS' : 'DEFICIT'
      }
    });
  } catch (error) {
    console.error('Error al cerrar turno:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;