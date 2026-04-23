# React Router Widget Client Migration Design

## Goal

Replace the current server-rendered widget HTML flow with a frontend-owned routing model based on React Router so that:

- frontend hot reload stays native and simple in development
- widget pages are addressed directly at `/calendar`, `/clock`, and `/days-remaining`
- the backend is reduced to API and static asset serving responsibilities
- runtime HTML injection is removed from the normal widget render path

## Current Problems

- The current widget experience crosses an awkward boundary between server HTML rendering and client hydration.
- Development hot reload is fragile because the frontend and backend both participate in deciding what HTML is returned.
- The client currently depends on injected runtime state to decide which widget to render and whether access is granted.
- The server owns widget page composition even though the UI itself already lives in the client app.

## Target Architecture

### Frontend

`apps/widget-client` becomes the owner of widget page routing.

- React Router handles `/calendar`, `/clock`, and `/days-remaining`
- each route knows its widget identity from the pathname
- each route is responsible for fetching access state from the backend
- each route shows a short loading screen before rendering the final locked or premium state

The frontend no longer reads injected widget runtime from the HTML document for normal widget rendering.

### Backend

`apps/widget-server` becomes an API and asset server.

Responsibilities:

- validate license access
- return widget access JSON through `/api/*`
- serve built frontend assets in production
- serve `index.html` as the fallback HTML document for widget routes in production

The backend no longer renders widget-specific HTML pages and no longer injects widget runtime into the HTML response for the standard widget flow.

### Monorepo

The monorepo remains in place.

- `apps/widget-client`: React Router frontend
- `apps/widget-server`: Express API and production asset server
- `packages/shared`: shared types and helpers that remain useful across both apps

This migration changes responsibilities, not repository layout.

## Route Model

### Frontend Routes

The frontend defines three user-facing widget routes:

- `/calendar`
- `/clock`
- `/days-remaining`

Optional future route:

- `/` may redirect to `/calendar` or show a lightweight landing page

### Backend Routes

The backend exposes API routes only for business logic.

Initial API shape:

- `GET /api/widget-access?widget=calendar&license=...`
- `GET /api/widget-access?widget=clock&license=...`
- `GET /api/widget-access?widget=daysRemaining&license=...`

Response shape:

```json
{
  "accessGranted": false,
  "purchaseUrl": "https://atomicskills.academy/widgets-notion/",
  "reason": "Licence introuvable"
}
```

The widget key does not need to be returned because the route already determines it on the client side.

## Client Rendering Flow

For each widget route:

1. Determine the widget from the route path.
2. Read `license` from the URL query string.
3. Call `/api/widget-access`.
4. Show a short loading state while waiting for the API response.
5. Render the final widget state once the response is available.

There is no intermediate server-injected runtime object in this flow.

## Development Workflow

Development uses a clean split between frontend and backend.

- Vite serves the frontend with native HMR on the public development URL
- Express serves the API on an internal development port
- the frontend dev server proxies `/api/*` to the backend

The browser should only interact with one visible app URL during normal frontend work.

This removes the need for the backend to participate in widget HTML generation during development.

## Production Workflow

Production uses a single public Node entrypoint.

- Express serves the built frontend assets
- Express exposes `/api/*`
- Express falls back to the built `index.html` for non-API widget routes

Result:

- the public app still supports `/calendar`, `/clock`, and `/days-remaining`
- there is no separate public backend port
- the backend is not independently exposed as a second visible service

Note that browser-consumed HTTP APIs are still technically callable by users through developer tools or direct requests. This design does not attempt to hide the existence of HTTP endpoints from the browser, only to avoid exposing a separate public backend service.

## File-Level Migration Plan

### Files To Keep Mostly Intact

- `apps/widget-client/src/components/**`
- `apps/widget-client/src/context/**`
- `apps/widget-server/src/services/**`
- `apps/widget-server/src/logging/**`
- `packages/shared/**`

### Files To Restructure On The Client

- `apps/widget-client/src/App.tsx`
  - becomes the app shell and router host
- `apps/widget-client/src/main.tsx`
  - mounts the router-based app
- add route modules such as:
  - `apps/widget-client/src/routes/calendar.tsx`
  - `apps/widget-client/src/routes/clock.tsx`
  - `apps/widget-client/src/routes/days-remaining.tsx`
- add a client API helper:
  - `apps/widget-client/src/lib/widget-access.ts`

### Files To Remove Or Replace On The Server

- `apps/widget-server/src/routes/widgets.ts`
  - remove server HTML widget rendering
- `apps/widget-server/src/routes/runtime.ts`
  - replace with a simpler access-focused API route
- `apps/widget-server/src/app.ts`
  - keep API registration
  - add production static asset serving and SPA fallback behavior

## Runtime Injection Removal

The current runtime injection path is no longer part of the target architecture.

The following responsibilities move away from HTML injection:

- selecting the active widget
- determining access state
- wiring purchase URL into the initial HTML payload

The client route becomes the source of truth for widget selection, and the API response becomes the source of truth for access state.

## Error Handling

### API Failure

If `/api/widget-access` fails:

- render the widget in locked mode
- keep `purchaseUrl` on the client as a known default
- optionally display a lightweight unavailable state if the failure should be visible

### Invalid Widget Route

If the route does not match one of the supported widgets:

- handle it as a frontend 404 or redirect

### Production Fallback

If a non-API route is requested:

- return the frontend `index.html`
- let React Router decide whether the route is valid

## Testing Strategy

### Frontend

- route-level tests for `/calendar`, `/clock`, `/days-remaining`
- tests for loading state behavior
- tests for locked and granted rendering based on API responses
- tests that widget selection comes from the route, not injected runtime

### Backend

- API tests for `/api/widget-access`
- tests for license validation results
- tests for static asset serving and SPA fallback in production mode

### End-To-End Verification

- `pnpm dev` starts the frontend with HMR and the backend API
- changing a frontend component updates the browser without custom server glue
- `/calendar`, `/clock`, and `/days-remaining` all resolve correctly in development and production

## Tradeoffs

### Benefits

- much simpler frontend development loop
- clearer boundary between UI and backend logic
- easier to reason about routing
- no widget HTML injection path to maintain

### Costs

- the first paint for widget state now depends on an API request
- a loading state becomes part of the normal UX
- some current tests and server routes must be rewritten

## Recommendation

Proceed with a React Router migration that keeps the current monorepo and Express backend, but narrows the backend to API and production asset serving only.

This is the lowest-cost migration that meaningfully fixes the hot reload problem without introducing the weight and conventions of Next.js or the fuller route-data model of Remix.
