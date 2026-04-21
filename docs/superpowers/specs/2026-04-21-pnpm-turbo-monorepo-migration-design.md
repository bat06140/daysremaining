# pnpm + Turborepo Migration Design

## Goal

Restructure the repository into a lightweight TypeScript monorepo so the React client, the Express license server, and the shared runtime contract are separated cleanly without changing the widget behavior or the public `?license=LICENCE` contract.

## Scope

This design covers:

- migration to `pnpm` workspaces
- adoption of `turbo` for task orchestration
- moving the React app into `apps/widget-client`
- moving the Express/LM4WC server into `apps/widget-server`
- creating `packages/shared` for client/server shared types and constants
- converting the server code from `.js` to `.ts`
- keeping existing widget routes and license behavior intact

This design does not cover:

- adding new widget features
- changing the license validation rules
- replacing Vite or Express
- introducing Nx or a heavier monorepo tool

## Target Layout

```text
apps/
  widget-client/
  widget-server/
packages/
  shared/
pnpm-workspace.yaml
turbo.json
package.json
```

### `apps/widget-client`

- owns the Vite + React application
- keeps widget rendering, theme editor UI, and current client tests
- depends on `@repo/shared` for the injected runtime contract and widget identifiers

### `apps/widget-server`

- owns the Express app, LM4WC decryption, MySQL access, and route handling
- serves `/calendar`, `/clock`, and `/days-remaining`
- injects the shared runtime payload into the built client HTML
- is fully TypeScript

### `packages/shared`

- exposes `WidgetKey`
- exposes the server-injected runtime shape
- exposes shared constants such as the widget purchase URL
- contains only environment-agnostic code

## Architecture

The repository becomes a single workspace with three packages:

- `@repo/widget-client`
- `@repo/widget-server`
- `@repo/shared`

Dependencies:

- client -> shared
- server -> shared
- shared -> no internal dependency

The client and server remain independently buildable, but the root workspace orchestrates them through `turbo`.

## Build and Scripts

Root scripts become workspace-oriented:

- `pnpm build`
- `pnpm test`
- `pnpm lint`
- `pnpm dev`

`turbo.json` orchestrates:

- `build`
- `test`
- `lint`
- `dev`

Expected outputs:

- client build -> `apps/widget-client/dist`
- server build -> `apps/widget-server/dist`

Runtime entrypoint:

- `pnpm --filter @repo/widget-server start`

## TypeScript Strategy

The server is migrated from `.js` to `.ts` during the move.

Server modules are organized as:

```text
apps/widget-server/src/
  index.ts
  app.ts
  routes/widgets.ts
  services/license-service.ts
  data/wordpress-db.ts
  crypto/lm4wc-defuse.ts
  html/render-widget-page.ts
```

Shared modules are organized as:

```text
packages/shared/src/
  widget-runtime.ts
  widget-access.ts
  widget-types.ts
```

The goal is explicit boundaries:

- route assembly in `routes`
- request-independent business logic in `services`
- MySQL in `data`
- Defuse/LM4WC decryption in `crypto`
- HTML runtime injection in `html`

## Migration Strategy

1. Create the workspace skeleton and root monorepo config.
2. Move the existing frontend into `apps/widget-client` with minimal behavioral change.
3. Move and convert the server into `apps/widget-server` in TypeScript.
4. Extract shared runtime/types/constants into `packages/shared`.
5. Repair imports, scripts, build output paths, and tests.
6. Verify the monorepo with full client tests, server tests, and builds.

This is a single coherent migration, not a partial split. The repository should not be left in a mixed root-level and workspace-level state.

## Verification

Success criteria:

- existing client tests still pass
- existing server tests still pass
- client build succeeds from its workspace package
- server TypeScript build succeeds from its workspace package
- root `pnpm build` and `pnpm test` succeed through `turbo`
- widget routes still accept `?license=LICENCE`

## Risks and Controls

- Path churn:
  controlled by moving code first, then fixing imports package-by-package
- Build drift between client and server:
  controlled by separating package-level configs and using `turbo` at the root
- Shared package becoming a dumping ground:
  controlled by limiting it to cross-runtime types, constants, and pure helpers only
