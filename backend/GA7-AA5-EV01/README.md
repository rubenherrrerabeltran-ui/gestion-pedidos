# API de registro e inicio de sesión — SENA

**Evidencia:** GA7-220501096-AA5-EV01  
**Aprendiz:** Rubén Darío Herrera Beltrán  
**Programa:** ANALISIS Y DESARROLLO DE SOFTWARE. (3186691)

## Ejecución

Requiere Node.js 18 o superior. No requiere instalación de librerías.
1. Abra la carpeta `backend/GA7-AA5-EV01`.
2. Ejecute `npm start`.
3. Abra `http://localhost:3000` en el navegador.
4. Registre un usuario de prueba y después inicie sesión.
5. Para probar la API: `npm test`.

## Endpoints

- `GET /api/salud`: indica estado de la API.
- `POST /api/registro`: crea usuario, HTTP 201. Entrada JSON con `usuario` y `contrasena`. Duplicado: 409; inválido: 400.
- `POST /api/login`: verifica credenciales, HTTP 200 y mensaje «Autenticación satisfactoria». Credenciales incorrectas: HTTP 401 y mensaje «Error en la autenticación».

Ejemplo: `{"usuario":"aprendiz01","contrasena":"Clave-SENA-2026!"}`.

Las contraseñas se almacenan usando scrypt y salt individual, no en texto plano. Los registros están en un archivo JSON local excluido de Git.

**Alcance académico:** no implementa sesiones persistentes ni conexión MySQL. Para producción se requieren HTTPS, limitación de intentos y controles adicionales. No utilice contraseñas personales reales.

Repositorio: https://github.com/rubenherrrerabeltran-ui/gestion-pedidos/tree/main/backend/GA7-AA5-EV01
