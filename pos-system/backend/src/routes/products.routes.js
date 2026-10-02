import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// 1. Obtener todos los productos
router.get('/', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Crear nuevo producto
router.post('/', (req, res) => {
  const { barcode, name, category, cost_price, sale_price, stock } = req.body;

  if (!name || !sale_price) {
    return res.status(400).json({ error: 'Nombre y precio de venta son obligatorios.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO products (barcode, name, category, cost_price, sale_price, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      barcode || `GEN-${Date.now()}`,
      name,
      category || 'Varios',
      cost_price || 0,
      sale_price,
      stock || 0
    );

    res.status(201).json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto: ' + error.message });
  }
});

// 3. Actualizar producto existente (precios / stock)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { barcode, name, category, cost_price, sale_price, stock } = req.body;

  try {
    const stmt = db.prepare(`
      UPDATE products 
      SET barcode = ?, name = ?, category = ?, cost_price = ?, sale_price = ?, stock = ?
      WHERE id = ?
    `);
    stmt.run(barcode, name, category, cost_price, sale_price, stock, id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto: ' + error.message });
  }
});
// 4. Importación masiva de productos (Lote / Bulk Upsert)
router.post('/bulk-import', (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'La lista de productos está vacía o es inválida.' });
  }

  const upsertStmt = db.prepare(`
    INSERT INTO products (barcode, name, category, cost_price, sale_price, stock)
    VALUES (@barcode, @name, @category, @cost_price, @sale_price, @stock)
    ON CONFLICT(barcode) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      cost_price = excluded.cost_price,
      sale_price = excluded.sale_price,
      stock = products.stock + excluded.stock
  `);

  const importTransaction = db.transaction((items) => {
    let importedCount = 0;
    for (const item of items) {
      if (item.name && item.sale_price) {
        upsertStmt.run({
          barcode: item.barcode ? String(item.barcode).trim() : `GEN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          name: String(item.name).trim(),
          category: item.category ? String(item.category).trim() : 'Varios',
          cost_price: Number(item.cost_price) || 0,
          sale_price: Number(item.sale_price) || 0,
          stock: Number(item.stock) || 0
        });
        importedCount++;
      }
    }
    return importedCount;
  });

  try {
    const totalImported = importTransaction(products);
    res.json({ success: true, count: totalImported });
  } catch (error) {
    console.error('Error en bulk-import:', error);
    res.status(500).json({ error: 'Error al importar productos: ' + error.message });
  }
});
// 5. Aumento masivo de precios por porcentaje y/o categoría
router.post('/bulk-price-update', (req, res) => {
  const { percentage, category, target, roundToFifty } = req.body;
  const pct = Number(percentage);

  if (isNaN(pct) || pct === 0) {
    return res.status(400).json({ error: 'El porcentaje de ajuste debe ser distinto de 0' });
  }

  const factor = 1 + (pct / 100);

  try {
    let query = 'SELECT id, cost_price, sale_price FROM products';
    const params = [];

    if (category && category !== 'ALL') {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const items = db.prepare(query).all(...params);

    const updateSalePriceStmt = db.prepare('UPDATE products SET sale_price = ? WHERE id = ?');
    const updateCostPriceStmt = db.prepare('UPDATE products SET cost_price = ? WHERE id = ?');
    const updateBothStmt = db.prepare('UPDATE products SET cost_price = ?, sale_price = ? WHERE id = ?');

    const updateTransaction = db.transaction((rows) => {
      let count = 0;
      for (const row of rows) {
        let newSale = row.sale_price;
        let newCost = row.cost_price;

        if (target === 'SALE' || target === 'BOTH') {
          newSale = Math.round(row.sale_price * factor);
          if (roundToFifty && newSale > 50) {
            newSale = Math.ceil(newSale / 50) * 50; // Redondeo a múltiplos de 50
          }
        }

        if (target === 'COST' || target === 'BOTH') {
          newCost = Math.round(row.cost_price * factor);
        }

        if (target === 'BOTH') {
          updateBothStmt.run(newCost, newSale, row.id);
        } else if (target === 'SALE') {
          updateSalePriceStmt.run(newSale, row.id);
        } else if (target === 'COST') {
          updateCostPriceStmt.run(newCost, row.id);
        }
        count++;
      }
      return count;
    });

    const updatedCount = updateTransaction(items);
    res.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error('Error en bulk-price-update:', error);
    res.status(500).json({ error: 'Error al actualizar precios: ' + error.message });
  }
});

export default router;