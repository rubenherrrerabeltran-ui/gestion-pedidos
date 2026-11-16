'use strict';
/**
 * SENA GA7-220501096-AA5-EV01: API de registro e inicio de sesión.
 * Backend Node.js; no almacena contraseñas en texto plano.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const MAX_BODY_BYTES = 16 * 1024;
const HASH_LENGTH = 64;
const DEFAULT_FILE = path.join(__dirname, '..', 'data', 'users.json');

function readUsers(file) {
  if (!fs.existsSync(file)) return [];
  const users = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(users)) throw new Error('Formato de usuarios inválido');
  return users;
}
function saveUsers(file, users) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(users, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}
// Utiliza scrypt y sal aleatoria única por usuario.
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, HASH_LENGTH).toString('hex') };
}
function verifyPassword(password, stored) {
  if (!stored || !/^[a-f0-9]{32}$/.test(stored.salt || '') ||
      !/^[a-f0-9]{128}$/.test(stored.hash || '')) return false;
  const candidate = crypto.scryptSync(password, stored.salt, HASH_LENGTH);
  return crypto.timingSafeEqual(candidate, Buffer.from(stored.hash, 'hex'));
}
function respond(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}
// Analiza JSON sin permitir solicitudes excesivamente grandes.
async function parseJson(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().includes('application/json')) {
    throw Object.assign(new Error('Se requiere Content-Type: application/json'), { status: 415 });
  }
  let body = '';
  for await (const chunk of req) {
    body += chunk.toString('utf8');
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Solicitud demasiado grande'), { status: 413 });
    }
  }
  try {
    const value = JSON.parse(body);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error();
    return value;
  } catch {
    throw Object.assign(new Error('El cuerpo debe ser un objeto JSON válido'), { status: 400 });
  }
}
function validateCredentials(data) {
  const username = typeof data.usuario === 'string' ? data.usuario.trim() : '';
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9._-]{3,30}$/.test(username)) {
    return { error: 'El usuario debe tener entre 3 y 30 caracteres válidos' };
  }
  if (typeof data.contrasena !== 'string' || data.contrasena.length < 8 || data.contrasena.length > 72) {
    return { error: 'La contraseña debe tener entre 8 y 72 caracteres' };
  }
  return { username, password: data.contrasena };
}
function createApp(options = {}) {
  const file = options.dataFile || DEFAULT_FILE;
  const htmlFile = path.join(__dirname, '..', 'public', 'index.html');
  return http.createServer(async (req, res) => {
    const route = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && route === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(htmlFile));
    }
    if (req.method === 'GET' && route === '/api/salud') {
      return respond(res, 200, { estado: 'activo', servicio: 'Autenticación SENA' });
    }
    if (!['/api/registro', '/api/login'].includes(route)) {
      return respond(res, 404, { mensaje: 'Ruta no encontrada' });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return respond(res, 405, { mensaje: 'Método no permitido' });
    }
    try {
      const data = await parseJson(req);
      const values = validateCredentials(data);
      if (values.error) return respond(res, 400, { mensaje: values.error });
      const { username, password } = values;
      const users = readUsers(file);
      const found = users.find(user => user.usuario.toLowerCase() === username.toLowerCase());
      if (route === '/api/registro') {
        if (found) return respond(res, 409, { mensaje: 'El usuario ya está registrado' });
        users.push({ id: crypto.randomUUID(), usuario: username, ...hashPassword(password) });
        saveUsers(file, users);
        return respond(res, 201, { mensaje: 'Registro satisfactorio', usuario: username });
      }
      if (!found || !verifyPassword(password, found)) {
        return respond(res, 401, { mensaje: 'Error en la autenticación' });
      }
      return respond(res, 200, { mensaje: 'Autenticación satisfactoria', usuario: found.usuario });
    } catch (error) {
      if (error.status) return respond(res, error.status, { mensaje: error.message });
      console.error('Error interno de la API:', error.message);
      return respond(res, 500, { mensaje: 'Error interno del servicio' });
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  createApp().listen(port, '127.0.0.1', () => {
    console.log('API de autenticación disponible en http://localhost:' + port);
  });
}
module.exports = { createApp, validateCredentials, hashPassword, verifyPassword };
