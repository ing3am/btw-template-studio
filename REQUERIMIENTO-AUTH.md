# Requerimiento — Autenticación (login)

**Estado:** implementado (API real + proxy local)  
**Rama:** `feature/auth-login`  
**Fecha:** 2026-07-18

## Contrato API

- **URL:** `https://test-apiconnect.febtw.co/auth/Authentication`
- **Método:** `POST`
- **Headers:**
  - `user` = usuario del formulario
  - `password` = contraseña del formulario
- Body vacío (`Content-Length: 0`)

### Respuesta OK

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

El JWT se guarda en la sesión (`localStorage`) y se reutiliza como `AuthSession.token`.

### Respuesta error

HTTP `401` (u otro no-2xx) → credenciales inválidas.

## Front

- Pantalla `/login` (usuario + contraseña)
- Headers `user` / `password`
- Sesión con `token` JWT
- Claims del JWT (`nameid`, `role`) para mostrar usuario
- Rutas protegidas + cerrar sesión

## Dev (CORS)

Vite proxy:

- Browser → `/api-auth/auth/Authentication`
- Proxy → `https://test-apiconnect.febtw.co/auth/Authentication`

## Producción

Hace falta **proxy same-origin** (nginx) o CORS habilitado en el API.

## Fuera de alcance
- Recuperar contraseña / registro
- Roles Cliente vs Funcional (el JWT trae `role`, p. ej. ADS)
