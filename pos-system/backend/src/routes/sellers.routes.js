import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Obtener configuración del módulo
router.get('/config', (req, res) => {
  try {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'enable_seller_commissions'").get();
    res.json({ enabled: setting ? setting.value === 'true' : false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar estado del switch (habilitar / deshabilitar)
router.post('/config/toggle', (req, res) => {
  const { enabled } = req.body;
  try {
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('enable_seller_commissions', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(enabled ? 'true' : 'false');
    res.json({ success: true, enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar todos los vendedores activos
router.get('/', (req, res) => {
  try {
    const sellers = db.prepare('SELECT * FROM sellers WHERE is_active = 1 ORDER BY name ASC').all();
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo vendedor
router.post('/', (req, res) => {
  const { code, name, commission_percentage } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Código y nombre son requeridos' });

  try {
    const stmt = db.prepare(`
      INSERT INTO sellers (code, name, commission_percentage)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(code.trim().toUpperCase(), name.trim(), Number(commission_percentage) || 0);
    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: 'El código de vendedor ya existe o es inválido' });
  }
});

// Reporte de Comisiones y Ranking con filtro de fecha o mes
router.get('/report', (req, res) => {
  const { date, month } = req.query; // date: 'YYYY-MM-DD' o month: 'YYYY-MM'
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    let dateFilter = "DATE(datetime(s.created_at, 'localtime')) = DATE('now', 'localtime')";
    const params = [];

    if (month) {
      dateFilter = "strftime('%Y-%m', datetime(s.created_at, 'localtime')) = ?";
      params.push(month);
    } else if (date) {
      dateFilter = "DATE(datetime(s.created_at, 'localtime')) = ?";
      params.push(date);
    }

    const query = `
      SELECT 
        COALESCE(sel.code, s.seller_code, 'SIN_ASIGNAR') as seller_code,
        COALESCE(sel.name, 'Sin Vendedor Asignado') as seller_name,
        COALESCE(sel.commission_percentage, 0) as commission_percentage,
        COUNT(s.id) as total_sales_count,
        SUM(s.total_amount) as total_sold
      FROM sales s
      LEFT JOIN sellers sel ON sel.code = s.seller_code
      WHERE s.status = 'COMPLETED' AND ${dateFilter}
      GROUP BY s.seller_code
      ORDER BY total_sold DESC
    `;

    const ranking = db.prepare(query).all(...params);

    const formattedRanking = ranking.map(r => ({
      ...r,
      commission_earned: (r.total_sold * (r.commission_percentage / 100))
    }));

    res.json(formattedRanking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;