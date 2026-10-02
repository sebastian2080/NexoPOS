import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import QRCode from 'qrcode';

// Configuración con Access Token (se puede guardar en settings de SQLite o .env)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || 'TEST-TU-ACCESS-TOKEN-AQUI';

const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

export async function createQRPaymentPreference({ totalAmount, orderDescription, externalReference }) {
  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            title: orderDescription || 'Compra en NexoPOS',
            quantity: 1,
            unit_price: Number(totalAmount),
            currency_id: 'ARS'
          }
        ],
        external_reference: externalReference,
        back_urls: {
          success: 'http://localhost:4000/api/mp/success',
          failure: 'http://localhost:4000/api/mp/failure'
        },
        auto_return: 'approved'
      }
    });

    // Generar imagen QR en Base64 para mostrar directo en el frontend
    const qrImageBase64 = await QRCode.toDataURL(response.init_point);

    return {
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      qrImage: qrImageBase64
    };
  } catch (error) {
    console.error('Error generando cobro QR Mercado Pago:', error);
    return { success: false, error: error.message };
  }
}