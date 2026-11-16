'use strict';
// Pruebas reales de la API con Node.js (sin servicios externos).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/server');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sena-api-test-'));
const server = createApp({ dataFile: path.join(dir, 'users.json') });
let base;
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await new Promise(resolve => server.close(resolve));
  fs.rmSync(dir, { recursive: true, force: true });
});
const call = (route, payload) => fetch(base + route, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
});
const account = { usuario: 'aprendiz01', contrasena: 'Clave-SENA-2026!' };
test('GET /api/salud informa disponibilidad', async () => {
  const r = await fetch(base + '/api/salud');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).estado, 'activo');
});
test('Registro exitoso (201); no almacena contraseña en texto plano', async () => {
  const r = await call('/api/registro', account);
  assert.equal(r.status, 201);
  assert.equal((await r.json()).mensaje, 'Registro satisfactorio');
  assert.ok(!fs.readFileSync(path.join(dir, 'users.json'), 'utf8').includes(account.contrasena));
});
test('Registro duplicado (409)', async () => {
  assert.equal((await call('/api/registro', { ...account, usuario: 'APRENDIZ01' })).status, 409);
});
test('Contraseña corta (400)', async () => {
  assert.equal((await call('/api/registro', { usuario: 'nueva01', contrasena: '123' })).status, 400);
});
test('Login correcto (200)', async () => {
  const r = await call('/api/login', account);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).mensaje, 'Autenticación satisfactoria');
});
test('Login con contraseña incorrecta (401)', async () => {
  const r = await call('/api/login', { ...account, contrasena: 'Clave-distinta-2026' });
  assert.equal(r.status, 401);
  assert.equal((await r.json()).mensaje, 'Error en la autenticación');
});
test('Login con usuario inexistente (401)', async () => {
  assert.equal((await call('/api/login', { usuario: 'inexistente', contrasena: 'Clave-distinta-2026' })).status, 401);
});
test('Ruta incorrecta 404 y método incorrecto 405', async () => {
  assert.equal((await fetch(base + '/api/desconocida')).status, 404);
  assert.equal((await fetch(base + '/api/login')).status, 405);
});
test('La interfaz abre (200)', async () => {
  const r = await fetch(base + '/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Inicio de sesión/);
});
test('Content-Type incorrecto (415)', async () => {
  const r = await fetch(base + '/api/registro', {
    method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'hola'
  });
  assert.equal(r.status, 415);
});
