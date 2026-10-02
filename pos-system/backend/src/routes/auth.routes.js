import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// Crear tabla de usuarios e inicializar usuarios por defecto
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'CASHIER')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insertar Admin y Cajero base si no existen usuarios
const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (usersCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, pin, role) VALUES (?, ?, ?)');
  insertUser.run('Administrador', '1234', 'ADMIN');
  insertUser.run('Cajero Turno', '0000', 'CASHIER');
}

// 1. Listar usuarios para la pantalla de selección
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, role FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Validar Login con PIN
router.post('/login', (req, res) => {
  const { userId, pin } = req.body;
  try {
    const user = db.prepare('SELECT id, name, role FROM users WHERE id = ? AND pin = ?').get(userId, String(pin));

    if (!user) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Crear nuevo usuario (Solo Admin)
router.post('/users', (req, res) => {
  const { name, pin, role } = req.body;
  if (!name || !pin || !role) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const info = db.prepare('INSERT INTO users (name, pin, role) VALUES (?, ?, ?)').run(name, String(pin), role);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Cambiar PIN de un usuario
router.put('/users/:id/pin', (req, res) => {
  const { id } = req.params;
  const { newPin } = req.body;
  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'El PIN debe tener al menos 4 dígitos' });
  }

  try {
    db.prepare('UPDATE users SET pin = ? WHERE id = ?').run(String(newPin), id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;