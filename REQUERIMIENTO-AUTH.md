# Requerimiento — Autenticación (login)

**Estado:** implementado (MVP mock)  
**Rama:** `feature/auth-login`  
**Fecha:** 2026-07-18

## Alcance MVP
- Pantalla `/login` con **usuario** y **contraseña**
- Sesión persistente en `localStorage`
- Rutas de la app protegidas (redirigen a login)
- Cerrar sesión desde el header

## Credenciales demo
- Usuario: `funcional`
- Contraseña: `demo123`

## Fuera de alcance (luego)
- OAuth / SSO / JWT real contra API
- Roles Cliente vs Funcional en UI
- Recuperar contraseña / registro
