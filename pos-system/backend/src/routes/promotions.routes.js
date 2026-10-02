import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Obtener todas las promociones activas
router.get('/', (req, res) => {
  try {
    const promos = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
    res.json(promos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nueva promoción
router.post('/', (req, res) => {
  const { name, type, target_value, discount_percentage, buy_qty, pay_qty } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Nombre y tipo son obligatorios' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO promotions (name, type, target_value, discount_percentage, buy_qty, pay_qty, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(
      name,
      type,
      target_value || '',
      discount_percentage || 0,
      buy_qty || 0,
      pay_qty || 0
    );

    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alternar estado activo / inactivo
router.patch('/:id/toggle', (req, res) => {
  const { id } = req.params;
  try {
    const promo = db.prepare('SELECT is_active FROM promotions WHERE id = ?').get(id);
    if (!promo) return res.status(404).json({ error: 'Promoción no encontrada' });

    const newStatus = promo.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE promotions SET is_active = ? WHERE id = ?').run(newStatus, id);

    res.json({ success: true, is_active: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;