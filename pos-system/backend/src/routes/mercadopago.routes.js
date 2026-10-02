import { Router } from 'express';
import { createQRPaymentPreference } from '../services/mercadopago.service.js';
import db from '../db/database.js';

const router = Router();

// Generar QR para cobrar una venta
router.post('/create-qr', async (req, res) => {
  const { totalAmount, items, tempOrderId } = req.body;

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({ error: 'Monto inválido para cobro QR' });
  }

  const result = await createQRPaymentPreference({
    totalAmount,
    orderDescription: `Venta NexoPOS #${tempOrderId || Date.now()}`,
    externalReference: String(tempOrderId || Date.now())
  });

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result);
});

// Guardar o actualizar credenciales de Mercado Pago en settings
router.post('/config-token', (req, res) => {
  const { accessToken } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES ('mp_access_token', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(accessToken);
    res.json({ success: true, message: 'Access Token de Mercado Pago guardado.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;