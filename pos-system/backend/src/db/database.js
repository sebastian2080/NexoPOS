import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Determinar el directorio de persistencia seguro
let dbDir;
if (process.env.DB_PATH) {
  dbDir = process.env.DB_PATH;
} else if (process.env.APPDATA && process.env.NODE_ENV === 'production') {
  dbDir = path.join(process.env.APPDATA, 'NexoPOS', 'data');
} else {
  // En desarrollo, se guarda en la raíz del proyecto
  dbDir = path.join(__dirname, '../../');
}

// Crear la carpeta de datos si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFilePath = path.join(dbDir, 'pos.db');
console.log(`📁 Usando base de datos en: ${dbFilePath}`);

// 2. Inicializar la base de datos
const db = new Database(dbFilePath);

// Activar soporte de claves foráneas y modo WAL para máxima velocidad y concurrencia
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// 3. Función exportable para crear copias de seguridad (Backup)
export function createBackup() {
  try {
    const backupDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    db.backup(backupPath);
    console.log(`💾 Backup generado con éxito en: ${backupPath}`);
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Error al generar backup:', error);
    return { success: false, error: error.message };
  }
}

// 4. Inicializar esquemas y tablas
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
}

// Tabla de Promociones
db.exec(`
  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    target_value TEXT,
    discount_percentage REAL DEFAULT 0,
    buy_qty INTEGER DEFAULT 0,
    pay_qty INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabla de Movimientos de Dinero (Egresos / Ingresos)
db.exec(`
  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabla de Vendedores
db.exec(`
  CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    commission_percentage REAL DEFAULT 3.0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabla de Configuración Global del Sistema
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Insertar switch de comisiones por defecto si no existe
const commissionSetting = db.prepare("SELECT * FROM settings WHERE key = 'enable_seller_commissions'").get();
if (!commissionSetting) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('enable_seller_commissions', 'true')").run();
}

// Agregar columna seller_code a sales si no existe
try {
  db.exec(`ALTER TABLE sales ADD COLUMN seller_code TEXT`);
} catch (e) {
  // Ya existía
}

// Tabla de Pedidos Web / eCommerce
db.exec(`
  CREATE TABLE IF NOT EXISTS web_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    delivery_type TEXT DEFAULT 'STORE_PICKUP',
    payment_status TEXT DEFAULT 'PAID',
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Tabla de Ítems del Pedido Web
db.exec(`
  CREATE TABLE IF NOT EXISTS web_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES web_orders(id)
  )
`);

// Semilla de prueba si la tabla de pedidos web está vacía
try {
  const countOrders = db.prepare('SELECT COUNT(*) as count FROM web_orders').get();
  if (countOrders.count === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO web_orders (customer_name, customer_phone, customer_address, delivery_type, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const res1 = insertOrder.run('Carlos Gómez', '11-5544-3322', 'Retira en mostrador', 'STORE_PICKUP', 5200, 'PENDING');
    const res2 = insertOrder.run('Mariana López', '11-9988-7766', 'Av. San Martín 1420', 'HOME_DELIVERY', 2600, 'PREPARING');

    const insertItem = db.prepare(`
      INSERT INTO web_order_items (order_id, product_id, product_name, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertItem.run(res1.lastInsertRowid, 1, 'Coca Cola 2.25L', 2, 2600);
    insertItem.run(res2.lastInsertRowid, 1, 'Coca Cola 2.25L', 1, 2600);
  }
} catch (e) {
  // Ignorar si aún no hay productos de muestra
}

console.log('✅ Base de datos SQLite inicializada correctamente.');

export default db;