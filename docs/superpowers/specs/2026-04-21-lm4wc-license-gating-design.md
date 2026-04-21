# LM4WC License Gating Design

## Goal

Replace the public `hasLicense` flag with server-side license validation driven only by the `license` query parameter, using direct MySQL access to the WordPress LM4WC tables and local Defuse-compatible decryption. The widget must always render, but premium theme editing is unlocked only when the license is valid. Without a valid license, the palette button stays visible in a locked state and redirects to the purchase page.

Purchase URL: `https://atomicskills.academy/widgets-notion/`

## Scope

This design covers:

- direct MySQL access to WordPress license data
- Node-side LM4WC license decryption
- in-memory license indexing and per-key caching
- dedicated Express routes per widget type
- server-injected access state for the frontend
- removal of `hasLicense` as a public URL contract
- locked versus premium palette behavior in the UI

This design does not cover:

- WordPress REST integration
- license activation or renewal flows
- admin tooling around license diagnostics

## External Contract

The widget server exposes one route per widget type:

- `GET /calendar`
- `GET /clock`
- `GET /days-remaining`

Each route accepts the existing display query parameters plus a `license` query parameter:

- example: `/calendar?layout=square&license=XXXX-YYYY-ZZZZ`

The `license` query parameter exists only to provide the server with a license code to validate. It is not treated as a boolean, and there is no public `hasLicense` URL flag anymore.

The response is always a rendered widget page. Invalid, missing, inactive, expired, or uncheckable licenses do not return `403`. They render the widget in locked mode instead.

## Architecture

### Backend modules

- `server.js`
  - creates the Express app
  - serves the built frontend assets
  - handles widget routes
  - injects the resolved access state into the HTML response
- `db.js`
  - creates a shared MySQL2 pool for the WordPress database
- `crypto.js`
  - exposes `decryptLicenseKey(encryptedHex)`
  - reproduces LM4WC Defuse-compatible decryption in Node.js
- `licenseService.js`
  - loads encrypted licenses from MySQL
  - decrypts them safely
  - maintains an in-memory index
  - caches access decisions per provided key
  - exposes `checkAccess(key)`

### Frontend integration

The frontend no longer treats URL parameters as the source of truth for license state. Instead, the server injects a small access payload into the rendered HTML:

```html
<script>
  window.__WIDGET_ACCESS__ = { granted: true };
</script>
```

If no payload is injected for any reason, the frontend falls back to locked mode.

## Data Model

The service reads from `wp_lmfwc_licenses` and uses at minimum:

- `license_key`
- `status`
- `expires_at`

Rows with `status IN (2, 3)` are loaded from MySQL so the service can distinguish inactive versus active entries without scanning unrelated states.

Internal normalized record shape:

```ts
type LicenseRecord = {
  key: string;
  status: number;
  expiresAt: Date | null;
};
```

Internal access payload shape:

```ts
type AccessResult = {
  access: boolean;
  reason?: string;
};
```

## Access Rules

`checkAccess(key)` returns access only when all of the following are true:

- the provided key matches a successfully decrypted LM4WC `license_key`
- the matching row has `status === 3`
- `expires_at` is `NULL` or later than the current server time

All other cases return locked access:

- missing key
- unknown key
- decryption failure on candidate rows
- `status === 2`
- expired license
- database unavailable

For database outages or refresh failures, return:

```ts
{ access: false, reason: "Service indisponible" }
```

The service must not throw an uncaught exception in those cases.

## Caching Strategy

Two layers are used together.

### Per-key cache

Use `node-cache` with `CACHE_TTL_SECONDS` defaulting to 3600 seconds.

Purpose:

- avoid repeating validation for the same valid key
- avoid repeated full decision paths for the same invalid key
- soften the impact of temporary database failures

### In-memory decrypted index

Maintain an in-memory map of decrypted records keyed by plain license string.

Purpose:

- avoid full rescans of decrypted data during the cache miss path
- keep the request path fast after initial hydration

Refresh behavior:

- warm on first request if empty
- refresh periodically on the same TTL cadence
- keep the previous in-memory snapshot if a refresh fails

This hybrid approach is preferred over querying MySQL by raw encrypted key because LM4WC stores encrypted license values and the server needs plaintext comparison after decryption.

## Database Access

`db.js` exposes a MySQL2 pool configured from environment variables:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Initial query:

```sql
SELECT license_key, status, expires_at
FROM wp_lmfwc_licenses
WHERE status IN (2, 3)
```

The design assumes this scan is acceptable because:

- only a limited subset of rows is loaded
- refreshes are amortized by memory caching
- per-key caching prevents repeated work for hot keys

## LM4WC Decryption

`crypto.js` reproduces the LM4WC / Defuse decryption path in Node.js using:

- AES-256-CBC
- HMAC-SHA256
- Defuse message layout: `[version(4) + hmac(32) + iv(16) + ciphertext]`
- hex-encoded payloads from MySQL

Secrets come from:

- `LMFWC_SECRET`
- `LMFWC_DEFUSE`

`decryptLicenseKey(encryptedHex)`:

- parses the hex payload
- derives or reconstructs the symmetric material expected by LM4WC
- verifies HMAC before decrypting
- decrypts the ciphertext
- returns the plaintext license string

Error handling:

- malformed input throws locally
- callers must catch errors per row
- logs must never include plaintext keys or the provided query key

Because LM4WC depends on a PHP Defuse implementation detail, this logic must also be validated against at least one real encrypted WordPress row before production rollout.

## Request Flow

For each widget route:

1. Read `req.query.license` as a raw string.
2. Call `checkAccess(license)`.
3. Resolve widget route metadata such as widget type and layout.
4. Serve the frontend HTML with:
   - route-specific widget selection
   - injected access payload `{ granted: boolean, reason?: string }`
5. Let the frontend render in premium or locked mode based on injected state.

The frontend never upgrades itself to premium mode from the URL alone.

## Frontend Changes

### View resolution

`resolveAppView()` stops reading:

- `hasLicense`
- `license` as a boolean alias

It keeps only view-related concerns such as widget type and layout. Route selection now comes primarily from the Express endpoint, not from `/widget`.

### Access state

Replace public-facing `hasLicense` usage with an internal access concept, for example:

- `accessGranted`

This value is derived from the server-injected payload only.

### Palette button behavior

`WidgetThemeEditor` supports two explicit modes:

- `premium`
  - current editor behavior
  - color picker opens
  - premium theme saves are enabled
- `locked`
  - palette button stays visible
  - lock badge overlays the button
  - click redirects to `https://atomicskills.academy/widgets-notion/`
  - editor does not open

### Branding behavior

When access is locked:

- keep default theme behavior
- keep branding/footer behavior already associated with non-premium mode

When access is granted:

- hide branding
- enable premium theme editing

## Error Handling

### Decryption errors

- catch per row during index refresh
- skip only the failing row
- continue processing the rest

### Database errors

- catch in the service layer
- preserve previous in-memory snapshot when available
- return locked access with reason `Service indisponible`

### Missing or invalid query license

- do not fail the route
- render locked mode

## Security Constraints

- never log plaintext license keys
- never log the incoming query license value in clear text
- do not expose decrypted license data to the browser
- keep server-injected access payload minimal
- keep secrets in `.env` only

## Environment Variables

Add `.env.example` entries for:

```dotenv
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=
LMFWC_SECRET=
LMFWC_DEFUSE=
CACHE_TTL_SECONDS=3600
PORT=3000
```

## Testing

### Unit tests

- view resolution no longer accepts `hasLicense`
- access decision logic for:
  - active key
  - inactive key
  - expired key
  - unknown key
  - database unavailable
  - per-row decryption failure

### Integration checks

- `GET /calendar?license=valid`
  - widget renders in premium mode
- `GET /calendar?license=invalid`
  - widget renders in locked mode
- `GET /clock`
  - widget renders in locked mode without crashing
- `GET /days-remaining?license=...`
  - route-specific widget renders correctly

### Manual verification

- confirm lock badge renders over the palette button
- confirm locked click opens the purchase URL
- confirm valid license unlocks the existing editor flow
- verify a real LM4WC encrypted row decrypts correctly

## Implementation Notes

- keep module boundaries small and explicit
- avoid coupling frontend components directly to query string parsing
- prefer route-driven widget selection over a generic `/widget` entrypoint
- retain current showcase support only if it remains useful internally; it is not part of the new external contract

## Open Decisions Resolved

- no `403` page for invalid licenses
- `license` remains in the GET query string as a server input
- `/widget` is replaced by one route per widget type
- locked mode remains visible and upsells through the palette button
