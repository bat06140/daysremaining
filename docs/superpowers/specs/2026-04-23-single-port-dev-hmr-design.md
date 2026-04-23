# Single-Port Dev HMR Design

## Goal

Provide a reliable `pnpm dev` workflow with a single browser URL and immediate frontend updates, without adding opaque custom runtime glue into the application code.

The target developer experience is:

- run `pnpm dev`
- open a single public URL, `http://localhost:3000`
- edit files in `apps/widget-client`
- see changes appear immediately in the browser

The solution must stay understandable and use standard tools rather than a handwritten dev runner.

## Scope

This design covers:

- a single-port development workflow for the monorepo root
- frontend hot reload through Vite
- backend dev execution on an internal port
- proxying backend requests through the frontend dev server
- a dev-only runtime loading path so frontend pages do not depend on server-rendered HTML injection

This design does not cover:

- changing the production build or production server contract
- removing Express from production widget serving
- changing license validation rules
- introducing a custom `scripts/dev.mjs`-style coordinator

## Requirements

The dev workflow must satisfy all of the following:

- `pnpm dev` is the main entrypoint
- the browser uses a single visible port
- frontend edits are reflected immediately in the browser
- the solution uses native or standard tooling
- the application runtime remains easy to understand
- production behavior remains unchanged unless explicitly required later

## Recommended Approach

Use Vite as the single public dev entrypoint and keep Express on an internal port.

### Public and internal ports

- Vite dev server: `3000`
- Express dev server: `3001`

The browser talks only to Vite on `3000`.
Vite proxies backend requests to Express on `3001`.

### Why this is the recommended option

- Vite already solves frontend hot reload correctly
- the setup is conventional and well-documented
- no custom watcher script is needed
- frontend and backend concerns remain separated
- the production server can keep serving built assets as it does today

## Alternatives Considered

### 1. Recommended: Vite on `3000`, Express on `3001`, proxy through Vite

Pros:

- true native frontend HMR
- one public port
- no application-level bridge between Express and Vite
- easiest setup to reason about during day-to-day development

Cons:

- the backend is not the HTML entrypoint in dev
- dev needs a dedicated runtime-fetch path instead of server HTML injection

### 2. Express as the only public dev server with Vite middleware

Pros:

- one public port
- keeps Express as the visible entrypoint

Cons:

- requires application integration code between Express and Vite
- harder to understand and maintain
- easy to regress the interface with dev-only plumbing

This approach is explicitly rejected for this repo.

### 3. Full-page reload without Vite HMR

Pros:

- conceptually simpler than HMR

Cons:

- slower feedback loop
- worse React development experience
- no real advantage over standard Vite usage

This approach is not preferred.

## Architecture

### Root orchestration

The root `pnpm dev` command keeps using standard workspace orchestration.

Preferred shape:

- root `dev` script runs workspace `dev` tasks
- client `dev` task starts Vite on `3000`
- server `dev` task starts Express on `3001`

The orchestration layer is responsible only for starting processes, not for implementing runtime behavior.

### Client dev server

`apps/widget-client` owns the public development entrypoint.

Responsibilities:

- serve `index.html`
- provide React/Vite HMR
- answer `/calendar`, `/clock`, and `/days-remaining` in dev
- proxy backend requests under `/api/*` to `http://localhost:3001`

Suggested Vite config changes:

- `server.port = 3000`
- `server.strictPort = true`
- `server.proxy["/api"] = "http://localhost:3001"`

### Server dev process

`apps/widget-server` runs independently on an internal port.

Responsibilities:

- license validation
- purchase URL/runtime decisions
- JSON runtime endpoint(s)

Recommended watcher:

- `tsx watch src/index.ts`

Reasoning:

- standard tool
- no custom scripts
- avoids the previous `node --watch` watcher fragility
- simpler than `tsc -w` plus a second restart layer

### Runtime contract in development

In production today, Express injects runtime state into built HTML.

In development, that server-side HTML injection should not be used.
Instead, the client should fetch runtime state from a backend endpoint.

Recommended dev endpoint:

- `GET /api/widget-runtime`

Request shape:

- `widget`: one of `calendar`, `clock`, `daysRemaining`
- `license`: optional license query value copied from the URL

Response shape:

```ts
type WidgetRuntimeResponse = {
  widget?: "calendar" | "clock" | "daysRemaining";
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};
```

The client already knows the pathname and can derive the widget from it. The endpoint exists only to provide server-owned access state.

## Request Flow

### Development

1. User opens `http://localhost:3000/calendar?license=...`.
2. Vite serves the frontend HTML and HMR client.
3. The client derives the widget from `location.pathname`.
4. The client requests `/api/widget-runtime?...`.
5. Vite proxies the request to Express on `3001`.
6. Express returns runtime/access data.
7. The client renders the widget with that runtime.

### Production

Production keeps the current flow:

1. Express serves built frontend assets.
2. Express injects runtime into HTML.
3. The client reads the injected runtime.

This keeps the dev solution isolated from the production serving path.

## Code Changes

### Root package

- keep `pnpm dev` as the single command
- keep workspace orchestration
- do not add a custom root dev script file

### `apps/widget-client`

- configure Vite dev server to use port `3000`
- add proxy rules for `/api`
- ensure the dev server serves widget routes cleanly
- add a dev runtime fetch path in the client bootstrap/runtime code

### `apps/widget-server`

- add an API route for runtime resolution
- run server dev mode on `3001`
- switch from the current watcher chain to a standard watcher such as `tsx watch`
- keep existing HTML-injection logic for production routes

### Shared runtime logic

The frontend runtime reader should follow this order:

1. if injected runtime exists, use it
2. otherwise, in dev, fetch runtime from the API
3. if neither works, fall back to locked mode

This preserves existing production behavior while making dev independent from injected HTML.

## Testing and Verification

### Automated verification

- `pnpm lint`
- `pnpm build`
- `pnpm --filter @repo/widget-server run test`

### Manual verification

1. Run `pnpm dev`.
2. Open `http://localhost:3000/calendar`.
3. Modify a React component in `apps/widget-client/src/components`.
4. Confirm the browser updates immediately.
5. Confirm backend-powered access state still loads through `/api/widget-runtime`.
6. Confirm direct client routes `/calendar`, `/clock`, and `/days-remaining` all work in dev.

## Risks and Controls

### Dev/prod divergence

Risk:

- runtime comes from API in dev and injected HTML in prod

Control:

- keep both paths behind the same shared runtime type
- use the same backend service to compute access state
- prefer a single client helper that normalizes both sources

### Route behavior drift

Risk:

- Vite-served routes may behave differently from server-rendered routes

Control:

- keep route resolution in the client based on `pathname`
- manually verify all three widget routes during dev

### Watcher instability

Risk:

- server dev restarts become flaky again

Control:

- use a conventional watcher tool like `tsx watch`
- avoid layered watch chains and custom process coordinators

## Decision

Adopt a single-port dev workflow with:

- Vite as the public dev server on `3000`
- Express as the internal backend on `3001`
- standard workspace orchestration
- standard watcher tooling
- no custom dev runner
- no Express/Vite integration code inside the application runtime
