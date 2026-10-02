import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Asegurar que la columna cashier_name exista en la tabla sales
try {
  db.exec("ALTER TABLE sales ADD COLUMN cashier_name TEXT DEFAULT 'Cajero'");
} catch (e) {
  // La columna ya existe, continúa normalmente
}

// 1. Obtener todas las ventas para arqueo
router.get('/cash-register/summary', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    
    const sales = db.prepare(`
      SELECT id, total_amount, payment_method, amount_paid, change_returned, cashier_name, created_at
      FROM sales
      WHERE status = 'COMPLETED'
      ORDER BY id DESC
    `).all();

    return res.status(200).json(sales);
  } catch (error) {
    console.error('Error en cash-register/summary:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Obtener historial de ventas con ítems para reimpresión
router.get('/history', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const { date } = req.query;

    let query = `
      SELECT s.*, sel.name as seller_name
      FROM sales s
      LEFT JOIN sellers sel ON sel.code = s.seller_code
      WHERE s.status = 'COMPLETED'
    `;
    const params = [];

    if (date) {
      query += ` AND DATE(datetime(s.created_at, 'localtime')) = ?`;
      params.push(date);
    }

    query += ` ORDER BY s.id DESC LIMIT 100`;

    const sales = db.prepare(query).all(...params);

    const itemsStmt = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      LEFT JOIN products p ON p.id = si.product_id
      WHERE si.sale_id = ?
    `);

    const fullSales = sales.map(sale => {
      const items = itemsStmt.all(sale.id).map(it => ({
        id: it.product_id,
        name: it.product_name || 'Producto',
        quantity: it.quantity,
        sale_price: it.unit_price
      }));
      return {
        ...sale,
        total: sale.total_amount,
        items
      };
    });

    res.json(fullSales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener métricas y estadísticas del negocio
router.get('/metrics/dashboard', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    // 1. Resumen General
    const totalSalesRow = db.prepare(`
      SELECT 
        COUNT(id) as total_tickets,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sales
      WHERE status = 'COMPLETED'
    `).get();

    const totalCostRow = db.prepare(`
      SELECT COALESCE(SUM(si.quantity * p.cost_price), 0) as total_cost
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'COMPLETED'
    `).get();

    const totalRevenue = totalSalesRow.total_revenue || 0;
    const totalTickets = totalSalesRow.total_tickets || 0;
    const totalCost = totalCostRow.total_cost || 0;
    const totalProfit = totalRevenue - totalCost;
    const averageTicket = totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0;

    // 2. Facturación de los últimos 7 días
    const last7Days = db.prepare(`
      SELECT 
        DATE(datetime(created_at, 'localtime')) as sale_date,
        COALESCE(SUM(total_amount), 0) as daily_total,
        COUNT(id) as count
      FROM sales
      WHERE status = 'COMPLETED'
        AND DATE(datetime(created_at, 'localtime')) >= DATE('now', 'localtime', '-6 days')
      GROUP BY DATE(datetime(created_at, 'localtime'))
      ORDER BY sale_date ASC
    `).all();

    // 3. Top 5 Productos más vendidos
    const topProducts = db.prepare(`
      SELECT 
        p.name,
        p.category,
        SUM(si.quantity) as units_sold,
        SUM(si.quantity * si.unit_price) as total_generated
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id
      LEFT JOIN products p ON p.id = si.product_id
      WHERE s.status = 'COMPLETED'
      GROUP BY si.product_id
      ORDER BY units_sold DESC
      LIMIT 5
    `).all();

    // 4. Desglose por Medio de Pago
    const paymentMethods = db.prepare(`
      SELECT 
        payment_method,
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(id) as count
      FROM sales
      WHERE status = 'COMPLETED'
      GROUP BY payment_method
    `).all();

    res.json({
      summary: {
        totalRevenue,
        totalProfit,
        totalTickets,
        averageTicket
      },
      last7Days,
      topProducts,
      paymentMethods
    });
  } catch (error) {
    console.error('Error al generar métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Registrar nueva venta
router.post('/', (req, res) => {
  const { items, payment_method, amount_paid, change_returned, seller_code, cashier_name } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'El carrito no puede estar vacío.' });
  }

  const createSaleTransaction = db.transaction((saleData) => {
    let calculatedTotal = 0;

    for (const item of saleData.items) {
      calculatedTotal += item.quantity * item.unit_price;
    }

    const insertSale = db.prepare(`
      INSERT INTO sales (total_amount, payment_method, amount_paid, change_returned, seller_code, cashier_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const saleResult = insertSale.run(
      calculatedTotal,
      saleData.payment_method || 'CASH',
      saleData.amount_paid || calculatedTotal,
      saleData.change_returned || 0,
      saleData.seller_code ? saleData.seller_code.trim().toUpperCase() : null,
      saleData.cashier_name || 'Cajero'
    );

    const saleId = saleResult.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ? WHERE id = ?
    `);

    for (const item of saleData.items) {
      insertItem.run(saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);
      updateStock.run(item.quantity, item.product_id);
    }

    return { saleId, total: calculatedTotal };
  });

  try {
    const result = createSaleTransaction({ 
      items, 
      payment_method, 
      amount_paid, 
      change_returned, 
      seller_code, 
      cashier_name 
    });
    return res.status(201).json({ success: true, saleId: result.saleId, total: result.total });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    return res.status(500).json({ error: 'Error procesando la venta: ' + error.message });
  }
});

export default router;