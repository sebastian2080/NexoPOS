import db from './database.js';

const initialProducts = [
  { barcode: '7790895000997', name: 'Coca Cola 1.5L', category: 'Bebidas', cost_price: 1800, sale_price: 2600, stock: 24 },
  { barcode: '7790895000998', name: 'Sprite 1.5L', category: 'Bebidas', cost_price: 1750, sale_price: 2500, stock: 18 },
  { barcode: '7791234567890', name: 'Alfajor Triple Chocolate', category: 'Snacks', cost_price: 800, sale_price: 1400, stock: 50 },
  { barcode: '7791234567891', name: 'Galletitas Pepas 500g', category: 'Almacén', cost_price: 1200, sale_price: 1900, stock: 15 },
  { barcode: '7791234567892', name: 'Agua Mineral 2L', category: 'Bebidas', cost_price: 900, sale_price: 1500, stock: 30 },
  { barcode: '7791234567893', name: 'Papas Fritas Clásicas 140g', category: 'Snacks', cost_price: 1500, sale_price: 2400, stock: 20 },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO products (barcode, name, category, cost_price, sale_price, stock)
  VALUES (@barcode, @name, @category, @cost_price, @sale_price, @stock)
`);

const insertMany = db.transaction((products) => {
  for (const product of products) insert.run(product);
});

insertMany(initialProducts);
console.log('✅ Productos de prueba insertados en la base de datos.');