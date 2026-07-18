# BTW Template Studio

Editor visual de plantillas PDF (React + Vite + TypeScript).

## Requisitos

- Node.js 20+

## Arranque local

```bash
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`.

Con `VITE_USE_MOCKS=true` (default) las plantillas viven en `localStorage`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |

## Deploy (producción)

Cada push a `main` (o “Run workflow” manual) construye y publica en:

- Host: `premiundev.com`
- Ruta: `/var/www/premiundev` (Nginx root)

### Secretos de GitHub (ya deben existir)

| Secret | Uso |
|---|---|
| `DEPLOY_HOST` | `premiundev.com` |
| `DEPLOY_USER` | usuario SSH |
| `DEPLOY_PASSWORD` | contraseña SSH |
| `DEPLOY_PATH` | `/var/www/premiundev` |
| `DEPLOY_PORT` | `22` (opcional) |

### Deploy local (opcional)

```bash
brew install hudochenkov/sshpass/sshpass
cp .env.deploy.example .env.deploy
# edita DEPLOY_PASSWORD en .env.deploy
npm run deploy
```

`.env.deploy` no se sube a git.

## Git standards (team)

Branches, commits, and PR titles use **Conventional Commits** in **English**.

See `.cursor/rules/git-standards.mdc`.

Examples:
- Branch: `feature/mandatory-labels`
- Commit: `feat(builder): add mandatory label validation`

## Documentación de producto

- `PLAN.md`
- `REQUERIMIENTO-BUILDER.md`
- `REQUERIMIENTO-TIPOGRAFIA.md`
- `REQUERIMIENTO-MEDIDAS.md`
- `REQUERIMIENTO-PAGINA.md`
