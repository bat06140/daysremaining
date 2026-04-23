# Days Remaining Monorepo

This repository now uses a workspace-only `pnpm` + `turbo` layout.

Packages:

- `apps/widget-client`: Vite/React widget client
- `apps/widget-server`: Node/Express widget server
- `packages/shared`: shared runtime and types

Useful commands from the repository root:

- `pnpm build`
- `pnpm test`
- `pnpm dev`
- `pnpm dev:calendar`
- `pnpm dev:days-remaining`
- `pnpm dev:clock`

Development workflow:

- `pnpm dev` starts the React Router frontend on `http://localhost:3000`
- the backend API runs internally on `http://localhost:3001`
- frontend widget routes are handled by React Router
- `/api/*` is proxied automatically to the backend in development
- production serves the built frontend app from Express on the same widget URLs
