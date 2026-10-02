import express from 'express';
import cors from 'cors';
import productsRoutes from './routes/products.routes.js';
import salesRoutes from './routes/sales.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import cashMovementsRoutes from './routes/cashMovements.routes.js';
import sellersRoutes from './routes/sellers.routes.js';
import webOrdersRoutes from './routes/webOrders.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import cashRoutes from './routes/cash.routes.js';
import authRoutes from './routes/auth.routes.js';
import mpRoutes from './routes/mercadopago.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/api/promotions', promotionsRoutes);
app.use('/api/cash-movements', cashMovementsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/web-orders', webOrdersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mp', mpRoutes);

// Registrar rutas
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor POS corriendo en http://localhost:${PORT}`);
});