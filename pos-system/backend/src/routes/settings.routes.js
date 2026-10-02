import { Router } from 'express';
import db from '../db/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 1. Obtener datos del local
router.get('/business-info', (req, res) => {
  try {
    const keys = ['business_name', 'business_cuit', 'business_address', 'business_city', 'receipt_footer'];
    const placeholders = keys.map(() => '?').join(',');
    const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).all(...keys);

    const config = {
      name: 'NEXO POS',
      cuit: '30-71234567-9',
      address: 'Av. Comercial 1234',
      city: 'Buenos Aires, Argentina',
      footerMessage: '¡Gracias por su compra!'
    };

    rows.forEach(r => {
      if (r.key === 'business_name') config.name = r.value;
      if (r.key === 'business_cuit') config.cuit = r.value;
      if (r.key === 'business_address') config.address = r.value;
      if (r.key === 'business_city') config.city = r.value;
      if (r.key === 'receipt_footer') config.footerMessage = r.value;
    });

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Guardar datos del local
router.post('/business-info', (req, res) => {
  const { name, cuit, address, city, footerMessage } = req.body;

  try {
    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateAll = db.transaction(() => {
      upsert.run('business_name', name || '');
      upsert.run('business_cuit', cuit || '');
      upsert.run('business_address', address || '');
      upsert.run('business_city', city || '');
      upsert.run('receipt_footer', footerMessage || '');
    });

    updateAll();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Descargar copia de seguridad de la base de datos SQLite
// 3. Descargar copia de seguridad de la base de datos SQLite
router.get('/backup', (req, res) => {
  try {
    // 1. Obtener la ruta real del archivo desde la instancia de la base de datos
    let dbPath = db.name;

    // 2. Si db.name no estuviera disponible, buscar en las ubicaciones estándar
    if (!dbPath || !fs.existsSync(dbPath)) {
      const candidates = [
        path.resolve(process.cwd(), 'database.sqlite'),
        path.resolve(process.cwd(), 'src/db/database.sqlite'),
        path.resolve(__dirname, '../../database.sqlite'),
        path.resolve(__dirname, '../db/database.sqlite'),
        path.resolve(process.cwd(), 'pos.sqlite'),
        path.resolve(process.cwd(), 'src/db/pos.sqlite')
      ];
      dbPath = candidates.find(p => fs.existsSync(p));
    }

    if (!dbPath || !fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'No se encontró el archivo de base de datos en el servidor.' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `nexopos_backup_${dateStr}.sqlite`;

    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    res.download(dbPath, fileName, (err) => {
      if (err && !res.headersSent) {
        console.error('Error al enviar backup:', err);
        res.status(500).json({ error: err.message });
      }
    });
  } catch (error) {
    console.error('Error en backup:', error);
    res.status(500).json({ error: 'Error al generar el respaldo: ' + error.message });
  }
});

export default router;