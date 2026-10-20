# Rule: Reserved Root Segments in Next.js Storefront Middleware

When adding standalone admin apps or top-level portals (e.g. embedded Saleor Dashboard apps) in this repository:

1. **Register in Middleware**:
   Always register the root segment in `RESERVED_ROOT_SEGMENTS` inside `frontend/src/middleware.ts`:
   ```typescript
   const RESERVED_ROOT_SEGMENTS = new Set([
       "admin",
       "community-admin",
       "ai-admin",
       "api",
       "checkout",
       "order",
       ...
   ]);
   ```
   Failing to do so will cause the middleware to rewrite the URL into `/[locale]/[channel]/<slug>`, causing a 404 page not found.

2. **Dual Route Pattern**:
   Always provide both a root page and a catch-all slug page:
   - `src/app/(root)/<slug>/page.tsx`
   - `src/app/(root)/<slug>/[...slug]/page.tsx`
   This guarantees that Saleor Dashboard iframes with nested query params or appended paths resolve reliably without 404s.
