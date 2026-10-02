import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// 1. Obtener todos los movimientos del día
router.get('/', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const movements = db.prepare(`
      SELECT * FROM cash_movements 
      WHERE DATE(datetime(created_at, 'localtime')) = DATE('now', 'localtime')
      ORDER BY id DESC
    `).all();
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Registrar un nuevo movimiento (Ingreso o Egreso)
router.post('/', (req, res) => {
  const { type, category, description, amount } = req.body;

  if (!type || !amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Monto y tipo de movimiento son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO cash_movements (type, category, description, amount)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(type, category || 'VARIOS', description || '', Number(amount));
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;