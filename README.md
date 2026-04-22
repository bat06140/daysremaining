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
