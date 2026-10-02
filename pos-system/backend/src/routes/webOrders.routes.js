import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Obtener todas las órdenes web con sus ítems
router.get('/', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const orders = db.prepare('SELECT * FROM web_orders ORDER BY id DESC').all();

    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM web_order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar estado del pedido (PENDING -> PREPARING -> READY -> DELIVERED)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    db.prepare('UPDATE web_orders SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;